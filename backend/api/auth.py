"""Authentication module - JWT token management and route protection."""

import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g
from models import User


def generate_token(user_id):
    """Generate a JWT access token for a user."""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    return jwt.encode(
        payload,
        os.getenv('SECRET_KEY', 'dev-secret-key'),
        algorithm='HS256'
    )


def decode_token(token):
    """Decode and validate a JWT token. Returns the payload or None."""
    try:
        payload = jwt.decode(
            token,
            os.getenv('SECRET_KEY', 'dev-secret-key'),
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def login_required(f):
    """Decorator to protect routes that require authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401

        token = auth_header.split(' ')[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        user = User.query.get(payload['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 401

        g.current_user = user
        return f(*args, **kwargs)
    return decorated
