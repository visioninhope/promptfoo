"""FastAPI server for the promptfoo RAG agent."""

from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain.memory import ConversationBufferMemory
from langchain.schema import SystemMessage
from pydantic import BaseModel

from .agent import PromptfooConfigAgent

app = FastAPI(title="Promptfoo RAG Agent API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store chat histories (in memory - use a proper database for production)
chat_histories: Dict[str, ConversationBufferMemory] = {}


class ChatRequest(BaseModel):
    """Chat request model."""

    session_id: str
    message: str


class ChatResponse(BaseModel):
    """Chat response model."""

    response: str
    config: Optional[str] = None
    is_valid: Optional[bool] = None
    errors: Optional[Dict[str, str]] = None


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Handle chat messages and generate configs when requested."""
    # Initialize or get existing chat memory
    if request.session_id not in chat_histories:
        chat_histories[request.session_id] = ConversationBufferMemory(
            return_messages=True
        )

    memory = chat_histories[request.session_id]

    # Check if this is a config generation request
    if "generate config" in request.message.lower():
        try:
            agent = PromptfooConfigAgent()
            config, is_valid, errors = agent.generate_config(request.message)

            # Store interaction in memory
            memory.chat_memory.add_user_message(request.message)
            response = f"I've generated a configuration based on your requirements. Here it is:\n\n```yaml\n{config}\n```"
            memory.chat_memory.add_ai_message(response)

            return ChatResponse(
                response=response, config=config, is_valid=is_valid, errors=errors
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Handle regular chat messages
    try:
        # Add user message to memory
        memory.chat_memory.add_user_message(request.message)

        # Generate response
        response = """I can help you generate promptfoo configuration files. 
        To generate a config, start your message with "generate config" and 
        describe your requirements. For example:
        
        "generate config for a customer service chatbot that uses GPT-4 and 
        tests for polite responses"
        """

        # Add AI response to memory
        memory.chat_memory.add_ai_message(response)

        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat/{session_id}/history")
async def get_chat_history(session_id: str) -> List[Dict[str, str]]:
    """Get chat history for a session."""
    if session_id not in chat_histories:
        return []

    memory = chat_histories[session_id]
    messages = memory.chat_memory.messages

    return [
        {
            "role": "user" if isinstance(msg, SystemMessage) else "assistant",
            "content": msg.content,
        }
        for msg in messages
    ]
