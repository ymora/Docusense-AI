from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50, description="Nom d'utilisateur")
    password: str = Field(..., min_length=1, description="Mot de passe")

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Nom d'utilisateur")
    email: EmailStr = Field(..., description="Adresse email")
    password: str = Field(..., min_length=8, description="Mot de passe (minimum 8 caractères)")

class UserInfo(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    role: str
    is_active: bool

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserInfo

class GuestResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserInfo

class TokenRefreshRequest(BaseModel):
    refresh_token: str
