# ─────────────────────────────────────────────
# Test Configuration
# ─────────────────────────────────────────────

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app
from app.models import User, Org
from app.core.security import create_access_token
import uuid

# Use SQLite in-memory for tests
TEST_DB_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def test_org(db):
    org = Org(
        id=str(uuid.uuid4()),
        name="Test Org",
        admin_email="admin@test.com",
        plan="pro",
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@pytest.fixture
def test_user(db, test_org):
    user = User(
        id=str(uuid.uuid4()),
        email="user@test.com",
        name="Test User",
        role="SECURITY_ADMIN",
        org_id=test_org.id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    token = create_access_token({
        "sub": test_user.id,
        "email": test_user.email,
        "role": test_user.role,
        "org_id": test_user.org_id,
    })
    return {"Authorization": f"Bearer {token}"}
