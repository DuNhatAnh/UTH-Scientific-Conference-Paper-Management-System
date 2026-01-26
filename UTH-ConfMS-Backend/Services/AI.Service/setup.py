#!/usr/bin/env python3
"""
Setup script for UTH-ConfMS AI Service
Initializes the service and downloads required resources
"""

import os
import sys
from pathlib import Path


def create_directories():
    """Create necessary directories"""
    print("📁 Creating directories...")
    directories = ["logs"]
    
    for dir_name in directories:
        Path(dir_name).mkdir(exist_ok=True)
        print(f"   ✓ Created {dir_name}/")


def setup_env_file():
    """Create .env file from template if it doesn't exist"""
    print("\n⚙️  Setting up environment configuration...")
    
    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            import shutil
            shutil.copy(".env.example", ".env")
            print("   ✓ Created .env from .env.example")
            print("   ⚠️  Please review and update .env with your settings")
        else:
            print("   ⚠️  .env.example not found")
    else:
        print("   ✓ .env already exists")


def download_nltk_data():
    """Download required NLTK data"""
    print("\n📚 Downloading NLTK data...")
    
    try:
        import nltk
        
        resources = [
            'punkt',
            'stopwords',
            'averaged_perceptron_tagger',
            'wordnet'
        ]
        
        for resource in resources:
            try:
                nltk.download(resource, quiet=True)
                print(f"   ✓ Downloaded {resource}")
            except Exception as e:
                print(f"   ⚠️  Failed to download {resource}: {e}")
    
    except ImportError:
        print("   ⚠️  NLTK not installed. Install with: pip install nltk")


def check_dependencies():
    """Check if all required dependencies are installed"""
    print("\n🔍 Checking dependencies...")
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "pydantic_settings",
        "language_tool_python",
        "nltk"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"   ✓ {package}")
        except ImportError:
            print(f"   ✗ {package} (missing)")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n   ⚠️  Missing packages: {', '.join(missing_packages)}")
        print("   Install with: pip install -r requirements.txt")
        return False
    
    return True


def test_service():
    """Test if the service can start"""
    print("\n🧪 Testing service configuration...")
    
    try:
        from config import settings
        print(f"   ✓ Configuration loaded")
        print(f"   Service: {settings.SERVICE_NAME}")
        print(f"   Version: {settings.SERVICE_VERSION}")
        
        from models import AIFeature
        print(f"   ✓ Models loaded")
        
        from audit_logging import audit_logger
        print(f"   ✓ Audit logging initialized")
        
        from author_service import author_service
        from reviewer_service import reviewer_service
        print(f"   ✓ All services loaded")
        
        return True
    
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False


def print_next_steps():
    """Print instructions for next steps"""
    print("\n" + "=" * 60)
    print("  Setup Complete!")
    print("=" * 60)
    print("\n📝 Next Steps:\n")
    print("1. Review and update .env file with your configuration")
    print("2. Start the service:")
    print("   uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    print("\n3. Test the API:")
    print("   python test_api.py")
    print("\n4. Access the API documentation:")
    print("   http://localhost:8000/docs")
    print("\n5. Check service health:")
    print("   http://localhost:8000/")
    print("\n" + "=" * 60)


def main():
    print("\n🚀 UTH-ConfMS AI Service Setup")
    print("=" * 60)
    
    # Create directories
    create_directories()
    
    # Setup environment
    setup_env_file()
    
    # Check dependencies
    deps_ok = check_dependencies()
    
    if not deps_ok:
        print("\n❌ Please install missing dependencies first")
        sys.exit(1)
    
    # Download NLTK data
    download_nltk_data()
    
    # Test service
    service_ok = test_service()
    
    if not service_ok:
        print("\n⚠️  Service configuration has errors. Please fix them before running.")
        sys.exit(1)
    
    # Print next steps
    print_next_steps()


if __name__ == "__main__":
    main()
