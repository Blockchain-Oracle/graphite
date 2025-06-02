
# NFT Metadata Format for Graphite Trust Badge

The NFT metadata server should respond to the URL query with standard JSON metadata that follows the OpenSea metadata standard (which is compatible with most NFT platforms). Here's how it works:

## URL Structure

Your tokenURI function constructs a URL with this pattern:
```
{metadataServer}/{tokenId}?trustScore={score}&badgeType={type}&badgeName={name}&badgeMessage={message}&owner={address}&verified={verified}&timestamp={timestamp}
```

Example URL:
```
https://example.com/api/metadata/1?trustScore=750&badgeType=4&badgeName=Elite%20Developer&badgeMessage=Trusted%20blockchain%20contributor&owner=0x1234567890abcdef1234567890abcdef12345678&verified=true&timestamp=1687245123
```

## Expected Metadata Response

The server should return a JSON object with this structure:

```json
{
  "name": "Graphite Trust Badge #1: Elite Developer",
  "description": "This badge represents a trust score of 750, placing the holder in the Influencer tier of the Graphite ecosystem. The holder has demonstrated significant trust and reputation.",
  "image": "https://example.com/api/badge-images/1.png",
  "external_url": "https://example.com/viewer/1",
  "attributes": [
    {
      "trait_type": "Trust Score",
      "value": 750
    },
    {
      "trait_type": "Trust Tier",
      "value": "Influencer"
    },
    {
      "trait_type": "Badge Type",
      "value": 4
    },
    {
      "trait_type": "Verified",
      "value": true
    },
    {
      "display_type": "date", 
      "trait_type": "Last Updated",
      "value": 1687245123
    }
  ]
}
```

## Implementation Notes

1. **Badge Image Generation**:
   - The server should dynamically generate badge images based on badgeType and trustScore
   - You can use server-side SVG generation, canvas drawing, or pre-generated images

2. **Trust Tier Mapping**:
   - 0-199: Newcomer
   - 200-399: Established
   - 400-599: Trusted
   - 600-799: Influencer
   - 800-1000: Authority

3. **Custom Fields**:
   - Name and message should incorporate the custom values if provided
   - Fallback to generic names if custom fields are empty

4. **MIME Type**:
   - Response should include `Content-Type: application/json` header

5. **CORS Headers**:
   - Set appropriate CORS headers to allow access from your frontend domains:
   ```
   Access-Control-Allow-Origin: *
   ```

You can implement this server in any backend technology (Node.js, Python, etc.) that can parse URL parameters and generate dynamic JSON responses.
