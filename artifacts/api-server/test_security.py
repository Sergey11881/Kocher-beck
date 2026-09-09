import os
import sys
import unittest

os.environ.setdefault("API_ALLOWED_ORIGINS", "https://allowed.example")

sys.path.insert(0, os.path.dirname(__file__))
import server


class SecurityRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = server.app.test_client()

    def setUp(self):
        server.rate_limits.clear()

    def login(self):
        response = self.client.post(
            "/api/auth/login",
            json={"password": os.environ["API_OPERATOR_PASSWORD"]},
        )
        self.assertEqual(response.status_code, 200)
        return response.json["access_token"]

    def test_public_and_protected_endpoint_policy(self):
        self.assertEqual(self.client.get("/api/healthz").status_code, 200)
        self.assertEqual(self.client.get("/api/products").status_code, 200)
        self.assertEqual(self.client.get("/api/orders").status_code, 401)
        token = self.login()
        self.assertEqual(
            self.client.get("/api/orders", headers={"Authorization": f"Bearer {token}"}).status_code,
            200,
        )

    def test_invalid_credentials_and_malformed_token(self):
        self.assertEqual(
            self.client.post("/api/auth/login", json={"password": "wrong"}).status_code,
            401,
        )
        self.assertEqual(
            self.client.get("/api/orders", headers={"Authorization": "Bearer malformed"}).status_code,
            401,
        )

    def test_cors_allowlist(self):
        allowed = self.client.get("/api/healthz", headers={"Origin": "https://allowed.example"})
        unknown = self.client.get("/api/healthz", headers={"Origin": "https://unknown.example"})
        self.assertEqual(allowed.headers.get("Access-Control-Allow-Origin"), "https://allowed.example")
        self.assertIsNone(unknown.headers.get("Access-Control-Allow-Origin"))

    def test_upload_download_requires_authentication(self):
        self.assertEqual(self.client.get("/api/uploads/anything").status_code, 401)

    def test_login_rate_limit(self):
        for _ in range(server.LOGIN_MAX_ATTEMPTS):
            self.client.post("/api/auth/login", json={"password": "wrong"})
        self.assertEqual(
            self.client.post("/api/auth/login", json={"password": "wrong"}).status_code,
            429,
        )


if __name__ == "__main__":
    unittest.main()
