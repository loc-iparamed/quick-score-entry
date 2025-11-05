# -*- coding: utf-8 -*-
"""
Cấu hình cho MCP Client - Quick Score Entry System
"""

# Firebase Configuration
FIREBASE_CONFIG = {
    "function_url": "https://us-central1-quick-score-entry.cloudfunctions.net/xiaozhiAgent",
    "secret_key": "324sadasd-fdg4-23r4-f34g-2345g34fdg34",
    "timeout": 10.0  # seconds
}

# XiaoZhi AI Configuration
XIAOZHI_CONFIG = {
    "mcp_endpoint": "wss://api.xiaozhi.me/mcp/?token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ4NTEyMiwiYWdlbnRJZCI6OTE5MDcwLCJlbmRwb2ludElkIjoiYWdlbnRfOTE5MDcwIiwicHVycG9zZSI6Im1jcC1lbmRwb2ludCIsImlhdCI6MTc2MjI3NjIzMCwiZXhwIjoxNzkzODMzODMwfQ.dlo7mqCtZFI6RquECuQ_LPxnawzX9DNIw9lZR_4RAi7fsDjWjrn4WC9FxGKXj-s3by1o4csfxgihpXyW8RIdvQ"
}

# MCP Client Configuration
CLIENT_CONFIG = {
    "name": "QuickScoreEntry-MCP-Client",
    "version": "1.0.0",
    "project": "Quick Score Entry System",
    "description": "MCP Client for XiaoZhi AI integration with student score management"
}

# Tool Configuration
TOOLS_CONFIG = {
    "education": {
        "student": {
            "get_info": {
                "name": "education.student.get_info",
                "description": "Tra cứu thông tin và điểm số của sinh viên trong hệ thống",
                "firebase_function": "getStudentInfo"
            }
        },
        "score": {
            "update": {
                "name": "education.score.update",
                "description": "Cập nhật điểm số của sinh viên cho một bài kiểm tra cụ thể",
                "firebase_function": "updateStudentScore"
            }
        }
    },
    "system": {
        "get_info": {
            "name": "system.get_info",
            "description": "Lấy thông tin hệ thống và trạng thái của MCP client"
        }
    }
}

# Logging Configuration
LOGGING_CONFIG = {
    "level": "INFO",
    "format": "[%(levelname)s] (%(name)s) %(message)s"
}
