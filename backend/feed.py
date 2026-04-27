import feedparser

# url = "https://news.google.com/rss/search?q=india+flood+cyclone+weather"
url = "https://mausam.imd.gov.in/rss/latest.xml"
feed = feedparser.parse(url)

print("Entries count:", len(feed.entries))

if len(feed.entries) == 0:
    print("No entries found — feed may be empty or broken")

for entry in feed.entries:
    print("TITLE:", entry.get("title", "No title"))
    print("SUMMARY:", entry.get("summary", "No summary"))
    print("-" * 40)