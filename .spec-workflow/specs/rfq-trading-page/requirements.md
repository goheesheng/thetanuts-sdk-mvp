# Requirements Document: RFQ Trading Page

## Introduction

This feature adds a new RFQ (Request for Quotation) trading page to the Thetanuts Finance MVP frontend. The RFQ system allows users to request custom quotes for options with specific parameters (strike prices, expiry, size) and receive competitive offers from market makers during an offer period. Unlike the existing Orderbook (instant fills), RFQ enables custom option structures including vanilla options, spreads, butterflies, condors, and iron condors.

The page will provide a complete RFQ lifecycle: creating RFQ requests, monitoring active RFQs, viewing incoming offers, settling quotes, and tracking RFQ history.

## Alignment with Product Vision

This feature extends the Thetanuts Finance MVP to support the full trading experience by adding the RFQ protocol alongside the existing Orderbook. This enables:
- **Custom terms**: Users can request specific strike prices and sizes not available on the orderbook
- **Better pricing for large orders**: Competitive bidding from market makers
- **Advanced strategies**: Support for multi-leg option structures (spreads, butterflies, condors)
- **Complete protocol coverage**: Full access to Thetanuts OptionFactory capabilities

## Requirements

### Requirement 1: Create RFQ Request

**User Story:** As a trader, I want to create an RFQ request with my desired option parameters, so that market makers can submit competitive offers.

#### Acceptance Criteria

1. WHEN user navigates to the RFQ page THEN system SHALL display an RFQ creation form
2. WHEN user selects option type THEN system SHALL display fields: underlying (ETH/BTC), option type (CALL/PUT), strike price(s), expiry, number of contracts, position (Long/Short), collateral token, offer deadline
3. WHEN user selects "Vanilla" structure THEN system SHALL show single strike input
4. WHEN user selects "Spread" structure THEN system SHALL show lower and upper strike inputs
5. WHEN user selects "Butterfly" structure THEN system SHALL show lower, middle, and upper strike inputs
6. WHEN user selects "Condor" structure THEN system SHALL show four strike inputs (strike1-4)
7. WHEN user selects "Iron Condor" structure THEN system SHALL show four strike inputs with iron condor-specific layout
8. IF user enters invalid parameters (e.g., expiry in the past, non-Friday 8:00 UTC expiry) THEN system SHALL display validation error
9. WHEN user submits valid RFQ form THEN system SHALL call `client.optionFactory.buildRFQRequest()` with appropriate builder method
10. WHEN user is creating a SELL (short) position THEN system SHALL prompt for collateral approval before RFQ submission
11. WHEN RFQ transaction is submitted THEN system SHALL display pending status with transaction hash
12. WHEN RFQ transaction is confirmed THEN system SHALL display success message with RFQ ID and navigate to Active RFQs view

### Requirement 2: View Active RFQs

**User Story:** As a trader, I want to view my active RFQ requests, so that I can monitor their status and see incoming offers.

#### Acceptance Criteria

1. WHEN user views Active RFQs tab THEN system SHALL fetch RFQs using `client.api.getUserRfqs(address)` filtered to 'active' status
2. WHEN active RFQs are loaded THEN system SHALL display: RFQ ID, underlying, option type, strikes, expiry, contracts, position, offer deadline, status, number of offers
3. WHEN an RFQ has incoming offers THEN system SHALL display offer count badge
4. WHEN user clicks on an RFQ row THEN system SHALL expand to show offer details
5. IF no active RFQs exist THEN system SHALL display "No active RFQ requests" message with prompt to create one

### Requirement 3: View and Decrypt Offers

**User Story:** As a trader, I want to view and decrypt offers on my RFQ requests, so that I can evaluate market maker bids.

#### Acceptance Criteria

1. WHEN user expands an RFQ with offers THEN system SHALL fetch offers from `client.api.getRfq(id)` which includes offers
2. WHEN offers are loaded THEN system SHALL attempt to decrypt each offer using `client.rfqKeys.decryptOffer()`
3. WHEN offer is successfully decrypted THEN system SHALL display: offeror address, offer amount (price per contract), total premium
4. IF offer decryption fails THEN system SHALL display "Encrypted offer - awaiting reveal" message
5. WHEN multiple offers exist THEN system SHALL sort by best price (lowest for buy, highest for sell)
6. WHEN offer deadline has not passed THEN system SHALL display countdown timer

### Requirement 4: Settle RFQ

**User Story:** As a trader, I want to settle an RFQ request after the offer period ends, so that I can execute the best offer.

#### Acceptance Criteria

1. WHEN offer deadline has passed AND offers exist THEN system SHALL enable "Settle" button
2. WHEN user clicks "Settle" THEN system SHALL call `client.optionFactory.settleQuotation(quotationId)`
3. IF user is a buyer THEN system SHALL ensure collateral approval for premium payment before settlement
4. WHEN settlement transaction is submitted THEN system SHALL display pending status
5. WHEN settlement is confirmed THEN system SHALL display success message with option contract address
6. WHEN settlement completes THEN system SHALL move RFQ to "Completed" history

### Requirement 5: Cancel RFQ

**User Story:** As a trader, I want to cancel an active RFQ request if no offers have been made, so that I can modify my request parameters.

#### Acceptance Criteria

1. WHEN RFQ has no offers AND is still in offer period THEN system SHALL display "Cancel" button
2. WHEN user clicks "Cancel" THEN system SHALL call `client.optionFactory.cancelQuotation(quotationId)`
3. WHEN cancellation is confirmed THEN system SHALL move RFQ to "Cancelled" history
4. IF RFQ has offers THEN system SHALL hide "Cancel" button and display tooltip explaining why

### Requirement 6: View RFQ History

**User Story:** As a trader, I want to view my completed and cancelled RFQ requests, so that I can track my trading history.

#### Acceptance Criteria

1. WHEN user views History tab THEN system SHALL fetch all user RFQs using `client.api.getUserRfqs(address)`
2. WHEN history is loaded THEN system SHALL display: RFQ ID, underlying, strikes, expiry, status (settled/cancelled), settlement price, option address (if settled)
3. WHEN user clicks on settled RFQ THEN system SHALL display full details including final offer, option contract address
4. WHEN user clicks on option address THEN system SHALL link to BaseScan

### Requirement 7: Real-time Updates

**User Story:** As a trader, I want to receive real-time updates on my active RFQs, so that I can see new offers as they arrive.

#### Acceptance Criteria

1. WHEN user has active RFQs THEN system SHALL subscribe to WebSocket events using `client.ws.subscribeToRfq(quotationId, callbacks)`
2. WHEN new offer is made THEN system SHALL trigger `onOfferMade` callback and update UI
3. WHEN offer is revealed THEN system SHALL trigger `onOfferRevealed` callback and attempt decryption
4. WHEN RFQ is settled THEN system SHALL trigger `onSettled` callback and update status
5. WHEN RFQ is cancelled THEN system SHALL trigger `onCancelled` callback and update status
6. WHEN WebSocket connection fails THEN system SHALL display connection status and retry

### Requirement 8: RFQ Key Management

**User Story:** As a trader, I want the system to automatically manage my encryption keys, so that I can securely receive sealed-bid offers.

#### Acceptance Criteria

1. WHEN user creates first RFQ THEN system SHALL call `client.rfqKeys.getOrCreateKeyPair()` to generate/load keys
2. WHEN creating RFQ THEN system SHALL include user's public key in `requesterPublicKey` parameter
3. WHEN keys are stored THEN system SHALL use browser localStorage via SDK's auto-detection
4. WHEN user wants to export keys THEN system SHALL provide option to view/copy public key

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: Each component (RFQForm, RFQList, OfferCard, etc.) should have a single, well-defined purpose
- **Modular Design**: RFQ components should be isolated and reusable, following existing patterns in `src/components/`
- **Dependency Management**: All RFQ SDK calls should be encapsulated in a dedicated hook (`useRFQ`)
- **Clear Interfaces**: Define TypeScript interfaces for all RFQ-related data structures

### Performance
- Initial page load should complete within 2 seconds
- RFQ list should support pagination or virtual scrolling for users with many RFQs
- WebSocket subscriptions should be efficiently managed (subscribe on mount, unsubscribe on unmount)
- Decryption operations should not block UI rendering

### Security
- Private keys for sealed-bid encryption must never be exposed in UI or logs
- All transaction signing must go through user's wallet (MetaMask)
- Collateral approval amounts should be exact (not unlimited approvals)
- Validate all user inputs before submitting transactions

### Reliability
- Handle network errors gracefully with retry options
- Display transaction status clearly (pending, confirmed, failed)
- Maintain UI state consistency during WebSocket disconnections
- Cache RFQ data to reduce redundant API calls

### Usability
- Provide clear tooltips explaining option structures and parameters
- Show estimated costs/premiums before transaction submission
- Display human-readable values (e.g., $2,500 not 250000000000)
- Support dark theme consistent with existing UI
- Mobile-responsive layout
