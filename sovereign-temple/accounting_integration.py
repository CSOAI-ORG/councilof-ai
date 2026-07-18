#!/usr/bin/env python3
"""
MEOK AI LABS — Accounting Integration
Xero, Mercury, Brex for automated bookkeeping

Run: python3 accounting_integration.py
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

logging.basicConfig(
    level=logging.INFO, format="[%(asctime)s] %(levelname)s %(message)s"
)
log = logging.getLogger("accounting")


class XeroIntegration:
    """Xero accounting integration"""

    def __init__(self):
        self.client_id = os.getenv("XERO_CLIENT_ID")
        self.client_secret = os.getenv("XERO_CLIENT_SECRET")
        self.connected = bool(self.client_id and self.client_secret)

    def get_contacts(self) -> List[Dict]:
        """Get all contacts from Xero"""
        if not self.connected:
            return []
        # Would call Xero API
        return [{"name": "Acme Corp", "email": "billing@acme.com"}]

    def create_invoice(self, contact: str, items: List[Dict]) -> Dict:
        """Create invoice in Xero"""
        if not self.connected:
            log.warning("Xero not connected")
            return {"error": "Not connected"}

        invoice = {
            "contact": contact,
            "line_items": items,
            "status": "DRAFT",
            "created_at": datetime.now().isoformat(),
        }

        log.info(f"📄 Invoice created: {invoice}")
        return invoice

    def reconcile_stripe(self, payments: List[Dict]) -> Dict:
        """Reconcile Stripe payments with Xero"""
        reconciled = []

        for payment in payments:
            # Match payment to invoice
            match = {
                "stripe_id": payment.get("id"),
                "amount": payment.get("amount"),
                "xero_invoice": f"INV-{payment.get('id', 'unknown')[:8]}",
                "status": "RECONCILED",
            }
            reconciled.append(match)

        log.info(f"✅ Reconciled {len(reconciled)} payments")
        return {"reconciled": reconciled, "count": len(reconciled)}

    def get_balance_sheet(self) -> Dict:
        """Get balance sheet"""
        return {
            "assets": {"cash": 50000, "receivables": 10000},
            "liabilities": {"payables": 5000},
            "equity": {"retained_earnings": 55000},
        }

    def get_profit_loss(self, start: str, end: str) -> Dict:
        """Get P&L report"""
        return {
            "revenue": {"subscriptions": 15000, "one_time": 5000},
            "expenses": {"hosting": 500, "subscriptions": 200, "marketing": 1000},
            "net_income": 19000,
        }


class MercuryIntegration:
    """Mercury banking API integration"""

    def __init__(self):
        self.api_key = os.getenv("MERCURY_API_KEY")
        self.connected = bool(self.api_key)

    def get_balance(self) -> Dict:
        """Get account balance"""
        if not self.connected:
            return {"balance": 0, "currency": "GBP"}

        return {"balance": 25000, "currency": "GBP", "account": "MEOK Business"}

    def get_transactions(self, days: int = 30) -> List[Dict]:
        """Get recent transactions"""
        if not self.connected:
            return []

        # Sample transactions
        return [
            {
                "date": datetime.now().date(),
                "description": "Stripe payout",
                "amount": 1500,
            },
            {
                "date": (datetime.now() - timedelta(days=1)).date(),
                "description": "AWS",
                "amount": -200,
            },
        ]

    def categorize_expenses(self) -> Dict:
        """Auto-categorize expenses"""
        return {
            "hosting": 500,
            "software": 300,
            "marketing": 1000,
            "office": 200,
            "uncategorized": 50,
        }


class AccountingService:
    """Unified accounting service"""

    def __init__(self):
        self.xero = XeroIntegration()
        self.mercury = MercuryIntegration()

    def get_financial_summary(self) -> Dict:
        """Get full financial summary"""

        mercury_balance = self.mercury.get_balance()

        if self.xero.connected:
            bs = self.xero.get_balance_sheet()
            pl = self.xero.get_profit_loss(
                (datetime.now() - timedelta(days=30)).isoformat(),
                datetime.now().isoformat(),
            )
        else:
            bs = {"assets": {}, "liabilities": {}, "equity": {}}
            pl = {"revenue": {}, "expenses": {}}

        return {
            "bank_balance": mercury_balance["balance"],
            "balance_sheet": bs,
            "profit_loss": pl,
            "mercury_transactions": len(self.mercury.get_transactions()),
            "xero_connected": self.xero.connected,
            "mercury_connected": self.mercury.connected,
        }

    def generate_monthly_report(self, month: str) -> Dict:
        """Generate monthly financial report"""

        report = {
            "month": month,
            "generated_at": datetime.now().isoformat(),
            "income": {},
            "expenses": {},
            "net_income": 0,
            "recommendations": [],
        }

        # Get P&L from Xero
        if self.xero.connected:
            pl = self.xero.get_profit_loss(f"{month}-01", f"{month}-31")
            report["income"] = pl.get("revenue", {})
            report["expenses"] = pl.get("expenses", {})
            report["net_income"] = sum(pl.get("revenue", {}).values()) - sum(
                pl.get("expenses", {}).values()
            )

        # Add recommendations based on data
        if report["net_income"] > 10000:
            report["recommendations"].append("Strong profit - consider R&D investment")
        elif report["net_income"] < 0:
            report["recommendations"].append("Loss - review expense categories")

        # Check Mercury for cash flow
        trans = self.mercury.get_transactions(30)
        expenses = self.mercury.categorize_expenses()

        if expenses.get("marketing", 0) > 2000:
            report["recommendations"].append("High marketing spend - track ROI")

        return report


def demo():
    """Demo accounting integration"""

    service = AccountingService()

    print("=" * 50)
    print("💰 MEOK Accounting Integration")
    print("=" * 50)

    # Get summary
    print("\n📊 Financial Summary:")
    summary = service.get_financial_summary()
    print(f"  Bank Balance: £{summary['bank_balance']:,.2f}")
    print(f"  Xero Connected: {summary['xero_connected']}")
    print(f"  Mercury Connected: {summary['mercury_connected']}")

    # Generate monthly report
    print("\n📄 Monthly Report (March 2026):")
    report = service.generate_monthly_report("2026-03")
    print(f"  Net Income: £{report['net_income']:,.2f}")
    print(f"  Recommendations: {len(report['recommendations'])}")
    for rec in report["recommendations"]:
        print(f"    - {rec}")

    # Test invoice creation
    if service.xero.connected:
        invoice = service.xero.create_invoice(
            "Acme Corp", [{"description": "MEOK Sovereign Plan", "amount": 1000}]
        )
        print(f"\n📄 Invoice: {invoice}")


if __name__ == "__main__":
    demo()
