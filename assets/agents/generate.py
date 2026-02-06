import urllib.request
import urllib.parse
import json
import time

agents = [
    ("dexter", "Professional avatar of a futuristic scientist named Dexter, wearing a sleek white lab coat with glowing blue circuit patterns. Holographic data displays float around showing DNA helixes and molecular structures. Smart focused expression, analytical eyes behind stylish glasses. Dark navy blue background with purple and cyan tech lighting accents. Digital art style, square format, high quality, cohesive cyberpunk aesthetic."),
    ("blossom", "Professional avatar of an elegant creative content creator named Blossom. Flowing elements combining cherry blossom petals with digital light particles and data streams. Nature meets technology aesthetic with warm pink and gold accents against dark background. Artistic sophisticated expression, flowing hair blending with petals. Digital art style, square format, high quality."),
    ("samurai_jack", "Professional avatar of a cyber-samurai coder named Samurai Jack. Character in disciplined warrior stance wearing futuristic armor with clean geometric lines. Glowing cyan code symbols flow like sword strikes around them. Honorable focused expression. Dark background with white and cyan accent lighting. Mix of traditional samurai aesthetics with futuristic tech. Digital art style, square format, high quality."),
    ("johnny_bravo", "Professional avatar of a confident sales agent named Johnny Bravo. Character wears a sharp dark suit with subtle gold tech accents and stylish sunglasses. Confident charming smirk, slicked-back hair. Professional yet edgy vibe. Dark background with warm golden and orange accent lighting. Charismatic personality. Digital art style, square format, high quality."),
    ("courage", "Professional avatar of a loyal friendly support agent named Courage. Warm kind eyes, helpful approachable stance. Friendly companion character with soft glowing green and blue accents suggesting warmth and reliability. Dark background with gentle lighting. Trustworthy welcoming personality. Digital art style, square format, high quality."),
    ("bug", "Professional avatar of a coordinator agent named Bug. Character designed with network node aesthetic - glowing connecting lines and geometric hexagonal patterns radiating like a central hub. Multiple colored data streams connecting to them. Organized efficient appearance. Dark background with interconnected glowing lines in blue, green, and purple. Hub-and-spoke visual motif. Digital art style, square format, high quality.")
]

for name, prompt in agents:
    print(f"Generating {name}...")
    try:
        # Use pollinations.ai with proper encoding
        encoded = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&seed=42&nologo=true&enhance=true"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        
        with urllib.request.urlopen(req, timeout=120) as response:
            data = response.read()
            if len(data) > 10000:  # Valid image should be larger
                with open(f"{name}.png", "wb") as f:
                    f.write(data)
                print(f"  ✓ Saved {name}.png ({len(data)} bytes)")
            else:
                print(f"  ✗ File too small ({len(data)} bytes)")
        
        time.sleep(2)  # Be nice to the API
    except Exception as e:
        print(f"  ✗ Error: {e}")

print("\nDone!")
