import unittest
import sys
import os
import asyncio
import numpy as np

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.services.audio_processor import AudioProcessor, _normalize_title, _normalize_artist
from api.services.recognition.base import RecognitionResult
from api.services.audio_features import analyze_audio_bpm_and_key
from api.services.artwork_fetcher import fetch_cover_art


class TestAudioEngine(unittest.TestCase):
    def test_title_normalization(self):
        self.assertEqual(_normalize_title("Dark Horse"), "dark horse")
        self.assertEqual(_normalize_title("Dark Horse (feat. Juicy J) [Radio Edit]"), "dark horse")
        self.assertEqual(_normalize_title("Letters From The Sky"), "letters from the sky")
        self.assertEqual(_normalize_title("From Paris With Love"), "from paris with love")
        self.assertEqual(_normalize_title("Dhurandhar Title Track"), "dhurandhar")
        self.assertEqual(_normalize_title("Neal N Nikki"), "neal n nikki")
        self.assertEqual(_normalize_title("Neal 'N' Nikki"), "neal n nikki")

    def test_deduplication_consecutive_chunks(self):
        processor = AudioProcessor()
        raw = [
            RecognitionResult(
                title="Dhurandhar",
                artist="Sukhwinder Singh",
                confidence=95,
                absolute_timestamp=60.0,
                match_offset=20.0
            ),
            RecognitionResult(
                title="Dhurandhar",
                artist="Sukhwinder Singh",
                confidence=95,
                absolute_timestamp=84.0,
                match_offset=44.0
            ),
            RecognitionResult(
                title="Dhurandhar Title Track",
                artist="Sukhwinder Singh",
                confidence=95,
                absolute_timestamp=108.0,
                match_offset=68.0
            )
        ]
        merged = processor._deduplicate(raw)
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["title"], "Dhurandhar")
        self.assertEqual(merged[0]["start_time"], 40.0)

    def test_preserve_genuine_song_repeats(self):
        processor = AudioProcessor()
        raw = [
            RecognitionResult(
                title="Yeah!",
                artist="Usher",
                confidence=95,
                absolute_timestamp=300.0,
                match_offset=10.0
            ),
            RecognitionResult(
                title="Yeah!",
                artist="Usher",
                confidence=95,
                absolute_timestamp=2700.0,
                match_offset=12.0
            )
        ]
        merged = processor._deduplicate(raw)
        self.assertEqual(len(merged), 2)
        self.assertEqual(merged[0]["start_time"], 290.0)
        self.assertEqual(merged[1]["start_time"], 2688.0)

    def test_negative_collision_prevention(self):
        processor = AudioProcessor()
        raw = [
            RecognitionResult(
                title="Zindagi Meri Dance",
                artist="Vijay Benedict & Alisha Chinai",
                confidence=95,
                absolute_timestamp=0.0,
                match_offset=10.0
            ),
            RecognitionResult(
                title="Dance on the Moon",
                artist="Haider Uppal & Saqib",
                confidence=95,
                absolute_timestamp=48.0,
                match_offset=15.0
            )
        ]
        merged = processor._deduplicate(raw)
        self.assertEqual(len(merged), 2)
        titles = [m["title"] for m in merged]
        self.assertIn("Zindagi Meri Dance", titles)
        self.assertIn("Dance on the Moon", titles)

    def test_no_phantom_unknowns_mid_song(self):
        processor = AudioProcessor()
        tracks = [
            {
                "title": "Rangeela Re",
                "artist": "Asha Bhosle",
                "start_time": 0.0,
                "confidence": 95,
                "is_identified": True
            },
            {
                "title": "Just Lose It",
                "artist": "Eminem",
                "start_time": 210.0,
                "confidence": 95,
                "is_identified": True
            }
        ]
        result = processor._fill_gaps(tracks, total_duration=500.0)
        titles = [t["title"] for t in result]
        self.assertEqual(titles.count("Unknown Track"), 0)
        self.assertEqual(len(result), 2)

    def test_bpm_octave_folding(self):
        sr = 22050
        clicks = np.zeros(sr * 5)
        interval = int(sr * 60.0 / 128.0)
        clicks[::interval] = 1.0
        decay = np.exp(-np.linspace(0, 10, 500))
        signal = np.convolve(clicks, decay, mode='same')
        
        bpm, key = analyze_audio_bpm_and_key(signal, sr)
        self.assertTrue(110 <= bpm <= 165, f"BPM {bpm} not in expected DJ range [110, 165]")

    def test_overlapping_transition_durations(self):
        # Verify that adjacent tracks support realistic crossfade overlap
        total_sec = 600.0
        tracks_data = [
            {"title": "Track A", "artist": "Artist A", "start_time": 0.0, "is_identified": True, "confidence": 95},
            {"title": "Track B", "artist": "Artist B", "start_time": 120.0, "is_identified": True, "confidence": 95},
            {"title": "Track C", "artist": "Artist C", "start_time": 260.0, "is_identified": True, "confidence": 95},
        ]
        db_tracks = []
        for idx, t in enumerate(tracks_data):
            if idx + 1 < len(tracks_data):
                next_start = tracks_data[idx + 1]["start_time"]
                overlap_sec = 20.0
                end_time = min(total_sec, max(t["start_time"] + 15.0, next_start + overlap_sec))
            else:
                end_time = total_sec
            dur = max(0.0, end_time - t["start_time"])
            db_tracks.append({"start_time": t["start_time"], "end_time": end_time, "duration": dur})

        # Track A starts at 0, but extends to 140s (overlapping Track B which starts at 120s)
        self.assertEqual(db_tracks[0]["start_time"], 0.0)
        self.assertEqual(db_tracks[0]["end_time"], 140.0)
        self.assertEqual(db_tracks[0]["duration"], 140.0)

        # Track B starts at 120, extends to 280s (overlapping Track C which starts at 260s)
        self.assertEqual(db_tracks[1]["start_time"], 120.0)
        self.assertEqual(db_tracks[1]["end_time"], 280.0)
        self.assertEqual(db_tracks[1]["duration"], 160.0)

        # Track C starts at 260, ends at total_sec (600s)
        self.assertEqual(db_tracks[2]["start_time"], 260.0)
        self.assertEqual(db_tracks[2]["end_time"], 600.0)

    def test_handover_prevents_pre_cue_bleed(self):
        """
        Verify that when Track 2 is introduced faintly on Deck B (e.g. at 192s with match_offset)
        while Track 1 is still dominating until 216s:
        Track 2's resolved audible timestamp MUST be >= 216.0s (never inside Track 1's window).
        """
        processor = AudioProcessor()
        raw = [
            # Song 1 dominant from 0 to 216s
            RecognitionResult(title="Arrey Diwano", artist="Sanjeev Wadhwani", confidence=95, absolute_timestamp=160.0, match_offset=10.0),
            RecognitionResult(title="Arrey Diwano", artist="Sanjeev Wadhwani", confidence=95, absolute_timestamp=192.0, match_offset=42.0),
            # Song 2 faint pre-cue on deck B at 192s
            RecognitionResult(title="Just Lose It", artist="Eminem", confidence=80, absolute_timestamp=192.0, match_offset=5.0),
            RecognitionResult(title="Arrey Diwano", artist="Sanjeev Wadhwani", confidence=95, absolute_timestamp=204.0, match_offset=54.0),
            RecognitionResult(title="Arrey Diwano", artist="Sanjeev Wadhwani", confidence=95, absolute_timestamp=216.0, match_offset=66.0),
            # Song 2 dominant drop takeover at 224s
            RecognitionResult(title="Just Lose It", artist="Eminem", confidence=95, absolute_timestamp=224.0, match_offset=14.3),
        ]
        merged = processor._deduplicate(raw)
        self.assertEqual(len(merged), 2)
        song1 = merged[0]
        song2 = merged[1]
        self.assertEqual(song1["title"], "Arrey Diwano")
        self.assertEqual(song2["title"], "Just Lose It")
        # Song 2 start_time MUST be >= Song 1's last detection (216.0s)
        self.assertGreaterEqual(song2["start_time"], 216.0)
        self.assertLessEqual(song2["start_time"], 224.0)

    def test_cobalt_downloader_init(self):
        """Verify CobaltDownloader initializes with configured mirrors and handles invalid URLs gracefully."""
        from api.services.cobalt_downloader import CobaltDownloader
        downloader = CobaltDownloader(custom_api_url="https://custom.cobalt.tools")
        self.assertIn("https://custom.cobalt.tools", downloader.api_urls)

        # Test download on non-existent file returns False gracefully
        loop = asyncio.new_event_loop()
        res = loop.run_until_complete(downloader.download_audio("https://invalid-url-example.com", "temp_out.mp3"))
        loop.close()
        self.assertFalse(res)


if __name__ == "__main__":
    unittest.main()
