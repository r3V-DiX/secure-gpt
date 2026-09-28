"""
Static data fixtures for BlackVector and multi-tenant seed command.
"""
from app.models.user import UserRole

BLACKVECTOR_DEPARTMENTS = [
    {"name": "Security & SecOps", "description": "Threat hunters, SOC analysts, and security engineers requiring strict zero-leakage DLP."},
    {"name": "Engineering & AI Lab", "description": "Core software engineers and ML researchers working with proprietary models and codebases."},
    {"name": "Finance & Operations", "description": "Accounting and treasury personnel handling payment cards, IBANs, and revenue metrics."},
    {"name": "Product & Growth", "description": "Product management, design, and growth teams interacting with AI daily."},
]

BLACKVECTOR_EMPLOYEES = [
    {"prefix": "sarah.connor", "name": "Sarah Connor", "role": UserRole.EMPLOYEE, "dept": "Engineering & AI Lab"},
    {"prefix": "alex.security", "name": "Alex Chen", "role": UserRole.SECURITY_ADMIN, "dept": "Security & SecOps"},
    {"prefix": "marcus.eng", "name": "Marcus Vance", "role": UserRole.EMPLOYEE, "dept": "Engineering & AI Lab"},
    {"prefix": "priya.dev", "name": "Priya Sharma", "role": UserRole.EMPLOYEE, "dept": "Engineering & AI Lab"},
    {"prefix": "elena.finance", "name": "Elena Rostova", "role": UserRole.EMPLOYEE, "dept": "Finance & Operations"},
    {"prefix": "david.ops", "name": "David Miller", "role": UserRole.EMPLOYEE, "dept": "Finance & Operations"},
    {"prefix": "sophia.pm", "name": "Sophia Torres", "role": UserRole.EMPLOYEE, "dept": "Product & Growth"},
]

OTHER_ORGS_DATA = [
    {
        "name": "Cyberdyne AI Systems",
        "domain": "cyberdyne.io",
        "plan": "enterprise",
        "admin": "miles.dyson@cyberdyne.io",
        "depts": ["Autonomous Systems", "Neural Research", "Operations"],
        "employees": [
            {"email": "miles.dyson@cyberdyne.io", "name": "Dr. Miles Dyson", "role": UserRole.ORG_ADMIN, "dept": "Neural Research", "triggers": 45},
            {"email": "john.cyber@cyberdyne.io", "name": "John Connor", "role": UserRole.EMPLOYEE, "dept": "Autonomous Systems", "triggers": 38},
            {"email": "tarik.ops@cyberdyne.io", "name": "Tarik Vance", "role": UserRole.EMPLOYEE, "dept": "Operations", "triggers": 22},
        ]
    },
    {
        "name": "AcmeCorp Global",
        "domain": "acmecorp.com",
        "plan": "enterprise",
        "admin": "admin@acmecorp.com",
        "depts": ["Cloud Infrastructure", "Corporate Legal", "Finance"],
        "employees": [
            {"email": "admin@acmecorp.com", "name": "Acme Admin", "role": UserRole.ORG_ADMIN, "dept": "Cloud Infrastructure", "triggers": 28},
            {"email": "jane.legal@acmecorp.com", "name": "Jane Legal", "role": UserRole.EMPLOYEE, "dept": "Corporate Legal", "triggers": 21},
            {"email": "bob.finance@acmecorp.com", "name": "Bob Banker", "role": UserRole.EMPLOYEE, "dept": "Finance", "triggers": 15},
        ]
    },
    {
        "name": "Stark Robotics",
        "domain": "starkrobotics.com",
        "plan": "pro",
        "admin": "admin@starkrobotics.com",
        "depts": ["Applied Defense", "R&D"],
        "employees": [
            {"email": "pepper.potts@starkrobotics.com", "name": "Pepper Potts", "role": UserRole.ORG_ADMIN, "dept": "Operations", "triggers": 19},
            {"email": "happy.hogan@starkrobotics.com", "name": "Happy Hogan", "role": UserRole.EMPLOYEE, "dept": "Applied Defense", "triggers": 13},
        ]
    }
]
