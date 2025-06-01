# backend/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

# Configure Google Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

app = FastAPI()

# Configure CORS to allow communication from your React frontend
# IMPORTANT: In production, change `allow_origins` to your frontend's specific URL!
origins = [
    "http://localhost:5174",  # Your React dev server
    # Add your production frontend URL here when you deploy!
    # "https://your-frontend-app.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
async def read_root():
    return {"message": "FastAPI backend is running!"}

@app.post("/convert-to-markdown/")
async def convert_to_markdown(files: list[UploadFile] = File(...)):
    markdown_results = {}
    for file in files:
        try:
            contents = await file.read()
            text_content = contents.decode("utf-8") # Assuming text-based files

            # Prepare the prompt for the AI
            prompt = f"""Convert the following text content into well-formatted Markdown.
            Ensure that headings, lists, code blocks, bold/italic text, and links are correctly identified and represented.
            Maintain the original meaning and structure as much as possible.
            If the input contains specific sections or logical divisions, represent them with appropriate Markdown headings.
            If there are lists, use Markdown bullet points or numbered lists.
            If there's code, use Markdown code blocks (```language).

            Here is the content to convert:

            ---
            {text_content}
            ---

            Please return only the Markdown content, without any additional introductory or concluding remarks.
            """

            # Call the AI model
            response = model.generate_content(prompt)
            markdown_output = response.text

            markdown_results[file.filename] = markdown_output

        except Exception as e:
            # Handle potential errors during file processing or AI call
            markdown_results[file.filename] = f"Error processing {file.filename}: {str(e)}"
            # Optionally, raise an HTTPException if you want to stop processing on first error
            # raise HTTPException(status_code=500, detail=f"Error processing {file.filename}: {str(e)}")

    return markdown_results