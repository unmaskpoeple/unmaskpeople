# NumVerge OTP - Virtual Number Verification & Carrier Telecom Aggregator Platform

NumVerge OTP is a high-performance web application designed to sell virtual phone numbers and aggregate SMS verification codes from carrier telecom networks.

## Architecture & Data Isolation
- **Cloud Firestore Namespace**: All live cloud database entities are strictly segregated under `numverge_*` collections:
  - `numverge_users`: Subscriber profiles, Firebase UID bindings, and live wallet balances.
  - `numverge_system`: Global platform settings, dynamic UPI QR configuration, and margin rules.
  - `numverge_upi_deposits`: Single-use UTR payment records and manual approval logs.
  - `numverge_otp_orders`: Virtual number orders, SMS codes, and carrier order telemetry.
  - `numverge_audit_logs`: Administrative actions and security compliance audit trails.
- **Session Isolation**: Authentication sessions are stored in `numverge_session` cookies to prevent collisions with other apps.
- **Carrier Telecom Integration**: Integrated with telecom API protocols with customizable profit markup and automated cancellation refunds.
- **Instant UPI Gateway**: Dynamic UPI QR generation with single-use UTR fraud protection.
