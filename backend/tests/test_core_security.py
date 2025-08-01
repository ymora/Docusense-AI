"""
Unit tests for security module
"""

import pytest
from unittest.mock import Mock, patch
import hashlib
import secrets

from app.core.security import (
    hash_password,
    verify_password,
    generate_token,
    verify_token,
    encrypt_data,
    decrypt_data,
    generate_salt,
    hash_with_salt,
    is_strong_password,
    sanitize_input
)


class TestSecurity:
    """Test cases for security functions"""
    
    def test_hash_password(self):
        """Test password hashing"""
        password = "test_password"
        hashed = hash_password(password)
        
        assert hashed != password
        assert len(hashed) > len(password)
        assert hashed.startswith("$2b$")  # bcrypt format
    
    def test_verify_password_correct(self):
        """Test password verification with correct password"""
        password = "test_password"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True
    
    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password"""
        password = "test_password"
        wrong_password = "wrong_password"
        hashed = hash_password(password)
        
        assert verify_password(wrong_password, hashed) is False
    
    def test_generate_token(self):
        """Test token generation"""
        token = generate_token()
        
        assert len(token) == 32
        assert isinstance(token, str)
    
    def test_verify_token_valid(self):
        """Test token verification with valid token"""
        token = generate_token()
        
        assert verify_token(token) is True
    
    def test_verify_token_invalid(self):
        """Test token verification with invalid token"""
        invalid_token = "invalid_token"
        
        assert verify_token(invalid_token) is False
    
    def test_encrypt_data(self):
        """Test data encryption"""
        data = "sensitive_data"
        key = "test_key_32_chars_long_for_testing"
        
        encrypted = encrypt_data(data, key)
        
        assert encrypted != data
        assert isinstance(encrypted, str)
    
    def test_decrypt_data(self):
        """Test data decryption"""
        data = "sensitive_data"
        key = "test_key_32_chars_long_for_testing"
        
        encrypted = encrypt_data(data, key)
        decrypted = decrypt_data(encrypted, key)
        
        assert decrypted == data
    
    def test_decrypt_data_invalid_key(self):
        """Test data decryption with invalid key"""
        data = "sensitive_data"
        key = "test_key_32_chars_long_for_testing"
        wrong_key = "wrong_key_32_chars_long_for_testing"
        
        encrypted = encrypt_data(data, key)
        
        with pytest.raises(Exception):
            decrypt_data(encrypted, wrong_key)
    
    def test_generate_salt(self):
        """Test salt generation"""
        salt = generate_salt()
        
        assert len(salt) == 16
        assert isinstance(salt, str)
    
    def test_hash_with_salt(self):
        """Test hashing with salt"""
        data = "test_data"
        salt = generate_salt()
        
        hashed = hash_with_salt(data, salt)
        
        assert hashed != data
        assert len(hashed) == 64  # SHA-256 hash length
        assert isinstance(hashed, str)
    
    def test_hash_with_salt_consistent(self):
        """Test that hashing with same salt produces same result"""
        data = "test_data"
        salt = generate_salt()
        
        hash1 = hash_with_salt(data, salt)
        hash2 = hash_with_salt(data, salt)
        
        assert hash1 == hash2
    
    def test_is_strong_password_strong(self):
        """Test strong password validation with strong password"""
        strong_passwords = [
            "StrongPass123!",
            "MySecureP@ssw0rd",
            "Complex#Password1",
            "VeryLongPassword123!@#"
        ]
        
        for password in strong_passwords:
            assert is_strong_password(password) is True
    
    def test_is_strong_password_weak(self):
        """Test strong password validation with weak password"""
        weak_passwords = [
            "weak",
            "123456",
            "password",
            "abc123",
            "short",
            "nouppercase123!",
            "NOLOWERCASE123!",
            "NoNumbers!",
            "NoSpecialChars123"
        ]
        
        for password in weak_passwords:
            assert is_strong_password(password) is False
    
    def test_sanitize_input(self):
        """Test input sanitization"""
        # Test HTML sanitization
        html_input = "<script>alert('xss')</script>Hello World"
        sanitized = sanitize_input(html_input)
        assert "<script>" not in sanitized
        assert "Hello World" in sanitized
        
        # Test SQL injection prevention
        sql_input = "'; DROP TABLE users; --"
        sanitized = sanitize_input(sql_input)
        assert "DROP TABLE" not in sanitized
        
        # Test normal input
        normal_input = "Hello World"
        sanitized = sanitize_input(normal_input)
        assert sanitized == normal_input
    
    def test_sanitize_input_empty(self):
        """Test input sanitization with empty input"""
        assert sanitize_input("") == ""
        assert sanitize_input(None) == ""
    
    def test_sanitize_input_special_chars(self):
        """Test input sanitization with special characters"""
        special_input = "Test & < > \" '"
        sanitized = sanitize_input(special_input)
        
        # Should not contain unescaped special characters
        assert "&" in sanitized or "&amp;" in sanitized
        assert "<" not in sanitized or "&lt;" in sanitized
        assert ">" not in sanitized or "&gt;" in sanitized 