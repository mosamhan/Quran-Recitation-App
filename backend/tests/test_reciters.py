#!/usr/bin/env python3
"""
Test script to verify reciter audio URLs are working
"""

import requests
from api.quran_api import QuranAPIService

def test_reciter_audio():
    """Test that all reciters can serve audio"""
    
    print("Testing Reciter Audio URLs")
    print("=" * 60)
    
    # Get all reciters
    reciters = QuranAPIService.get_available_reciters()
    print(f"\nTotal reciters to test: {len(reciters)}\n")
    
    # Test verse: Al-Fatiha, Verse 1 (absolute verse number = 1)
    test_chapter = 1
    test_verse = 1
    
    working = []
    failing = []
    
    for i, reciter in enumerate(reciters, 1):
        reciter_id = reciter['id']
        reciter_name = reciter['name']
        
        print(f"{i}. Testing {reciter_name} ({reciter_id})...", end=" ")
        
        try:
            # Get audio URL
            audio_url = QuranAPIService.get_audio_url(
                test_chapter, 
                test_verse, 
                reciter_id
            )
            
            if not audio_url:
                print("❌ No URL generated")
                failing.append((reciter_name, "No URL"))
                continue
            
            # Try to fetch the audio (HEAD request to avoid downloading)
            response = requests.head(audio_url, timeout=5)
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                content_length = response.headers.get('content-length', '0')
                size_kb = int(content_length) / 1024 if content_length.isdigit() else 0
                
                print(f"✅ OK ({size_kb:.1f}KB, {content_type})")
                working.append((reciter_name, audio_url))
            else:
                print(f"❌ HTTP {response.status_code}")
                failing.append((reciter_name, f"HTTP {response.status_code}"))
                
        except requests.exceptions.Timeout:
            print("❌ Timeout")
            failing.append((reciter_name, "Timeout"))
        except Exception as e:
            print(f"❌ Error: {str(e)[:40]}")
            failing.append((reciter_name, str(e)[:40]))
    
    # Summary
    print("\n" + "=" * 60)
    print(f"Results: {len(working)} working, {len(failing)} failing\n")
    
    if failing:
        print("Failed reciters:")
        for name, reason in failing:
            print(f"  ❌ {name}: {reason}")
        print()
    
    if working:
        print(f"✅ All {len(working)} reciters working correctly!")
        print("\nSample URLs:")
        for name, url in working[:3]:
            print(f"  {name}:")
            print(f"    {url}\n")
    
    return len(failing) == 0

if __name__ == "__main__":
    import sys
    success = test_reciter_audio()
    sys.exit(0 if success else 1)
