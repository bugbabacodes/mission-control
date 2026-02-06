#!/bin/bash

API_KEY="$OPENAI_API_KEY"

if [ -z "$API_KEY" ]; then
    echo "Error: OPENAI_API_KEY not set"
    exit 1
fi

generate_avatar() {
    local name=$1
    local prompt=$2
    local output_file="${name}.png"
    
    echo "Generating ${name}..."
    
    # Create the JSON payload
    local json_payload=$(cat <<EOF
{
    "model": "dall-e-3",
    "prompt": "$prompt",
    "size": "1024x1024",
    "quality": "standard",
    "n": 1
}
EOF
)
    
    # Make the API request
    local response=$(curl -s -X POST "https://api.openai.com/v1/images/generations" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$json_payload")
    
    # Extract the image URL
    local image_url=$(echo "$response" | grep -o '"url": "[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$image_url" ]; then
        # Download the image
        curl -s -L "$image_url" -o "$output_file"
        if [ -f "$output_file" ] && [ -s "$output_file" ]; then
            echo "  ✓ Saved ${output_file}"
        else
            echo "  ✗ Failed to download image for ${name}"
            rm -f "$output_file"
        fi
    else
        echo "  ✗ Failed to generate ${name}: $response"
    fi
}

# Generate Dexter - Research
generate_avatar "dexter" "A futuristic scientist avatar named Dexter for a tech team. Character wears a sleek lab coat with glowing blue accents. Holographic data displays float around them showing charts and molecular structures. Smart, focused expression with analytical eyes. Dark background with subtle purple and blue tech lighting. Square format, professional digital art style, dark theme compatible, cohesive with cyberpunk aesthetic."

# Generate Blossom - Content
generate_avatar "blossom" "A creative content creator avatar named Blossom for a tech team. Elegant character with flowing elements combining nature and digital aesthetics. Petals and light particles flow around them like data streams. Artistic, sophisticated expression with warm colorful accents against dark background. Nature meets technology theme. Square format, professional digital art style, dark theme compatible."

# Generate Samurai Jack - Code
generate_avatar "samurai_jack" "A cyber-samurai coder avatar named Samurai Jack for a tech team. Character in disciplined warrior stance with clean geometric lines. Code and digital symbols flow like sword strikes around them. Honorable, focused expression. Dark background with cyan and white accent lighting. Mix of traditional samurai aesthetics with futuristic tech elements. Square format, professional digital art style, dark theme compatible."

# Generate Johnny Bravo - Sales
generate_avatar "johnny_bravo" "A confident sales agent avatar named Johnny Bravo for a tech team. Character wears a sharp futuristic suit with subtle tech accents. Confident smirk, wearing stylish sunglasses. Professional yet edgy vibe with slicked-back hair. Dark background with golden and orange accent lighting. Charismatic and charming personality. Square format, professional digital art style, dark theme compatible."

# Generate Courage - Support
generate_avatar "courage" "A loyal support agent avatar named Courage for a tech team. Friendly companion character with warm, kind eyes and helpful stance. Approachable and trustworthy expression. Soft glowing accents suggesting warmth and reliability. Dark background with gentle green and blue lighting. Supportive, welcoming personality. Square format, professional digital art style, dark theme compatible."

# Generate Bug - Coordinator
generate_avatar "bug" "A coordinator agent avatar named Bug for a tech team. Character designed with network node aesthetic - connecting lines and geometric patterns radiating from them like a central hub. Organized, efficient appearance with multiple data streams connecting. Dark background with interconnected glowing lines in various colors. Hub-and-spoke visual motif. Square format, professional digital art style, dark theme compatible."

echo ""
echo "All avatars generated!"
