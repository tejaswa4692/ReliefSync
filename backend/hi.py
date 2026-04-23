from google import genai  # Note the change in import style
import os

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
response = client.models.generate_content(
    model="gemini-2.0-flash", 
    contents="say hi"
)
print(response.text)