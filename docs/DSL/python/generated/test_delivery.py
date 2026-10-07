import unittest

from delivery import (
    Actor,
    DeliveryRequest,
    DeliveryState,
    Evidence,
    allowed,
    assert_can_release,
    assert_can_settle,
    conforms,
    select_nearest,
    transition,
    validate_evidence_order,
)


class GeneratedDeliveryTests(unittest.TestCase):
    def test_request_constraint(self) -> None:
        DeliveryRequest("A", "B").validate()
        with self.assertRaisesRegex(ValueError, "T-DD-DSL_PICKUP_EQUALS_DROPOFF"):
            DeliveryRequest("A", "A").validate()

    def test_state_transition(self) -> None:
        self.assertEqual(
            transition(DeliveryState.REQUESTED, DeliveryState.COLLECTING),
            DeliveryState.COLLECTING,
        )
        with self.assertRaisesRegex(ValueError, "T-DD-DSL_ILLEGAL_TRANSITION"):
            transition(DeliveryState.REQUESTED, DeliveryState.SETTLED)

    def test_authorization(self) -> None:
        self.assertTrue(allowed(Actor.CUSTOMER, "pay"))
        self.assertFalse(allowed(Actor.CUSTOMER, "settle"))

    def test_forbidden_payment_and_settlement(self) -> None:
        with self.assertRaisesRegex(ValueError, "T-DD-DSL_RELEASE_BEFORE_PAYMENT"):
            assert_can_release(False)
        assert_can_release(True)

        with self.assertRaisesRegex(ValueError, "T-DD-DSL_INVALID_CODE"):
            assert_can_settle(False, True)
        with self.assertRaisesRegex(ValueError, "T-DD-DSL_NOT_AT_DROPOFF"):
            assert_can_settle(True, False)
        assert_can_settle(True, True)

    def test_skill(self) -> None:
        selected = select_nearest([
            {"available": True, "distance": 20},
            {"available": True, "distance": 5},
            {"available": False, "distance": 1},
        ])
        self.assertEqual(selected["distance"], 5)

    def test_evidence_and_conformance(self) -> None:
        evidence = (
            Evidence("request.received", 1),
            Evidence("intent.recognized", 2),
            Evidence("addresses.collected", 3),
            Evidence("courier.selected", 4),
            Evidence("payment.confirmed", 5),
            Evidence("delivery.released", 6),
            Evidence("location.received", 7),
            Evidence("location.received", 8),
            Evidence("code.validated", 9),
            Evidence("settlement.completed", 10),
        )
        validate_evidence_order(evidence)
        self.assertTrue(conforms(evidence))

        invalid = (
            Evidence("payment.confirmed", 1),
            Evidence("request.received", 2),
        )
        with self.assertRaisesRegex(ValueError, "T-DD-DSL_EVIDENCE_ORDER"):
            validate_evidence_order(invalid)

    def test_undeclared_evidence(self) -> None:
        with self.assertRaisesRegex(ValueError, "T-DD-DSL_UNDECLARED_EVIDENCE"):
            validate_evidence_order((Evidence("not.declared", 1),))


if __name__ == "__main__":
    unittest.main(verbosity=2)
