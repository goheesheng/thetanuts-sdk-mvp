# Requirements Document: RFQ Form Enhancements

## Introduction

This feature enhances the RFQ Create Form with improved validation, collateral estimation display, and limit order conversion options. Based on SDK documentation research:

1. **Contract Size**: Minimum is 0.001 (not 0.01) - contracts can be fractional
2. **Collateral**: Calculated based on option type and strikes, displayed before submission
3. **Reserve Price**: Optional; if not set and `convertToLimitOrder` is enabled, the RFQ converts to a limit order when no offers arrive
4. **Limit Order**: Opt-in feature via `convertToLimitOrder` flag

## Alignment with Product Vision

These enhancements improve usability by showing users exactly what collateral they need before creating an RFQ, support smaller trade sizes (0.001 contracts), and provide the flexibility of limit order conversion for better execution.

## Requirements

### Requirement 1: Flexible Contract Size Input

**User Story:** As a trader, I want to enter contract sizes as small as 0.001, so that I can trade smaller positions.

#### Acceptance Criteria

1. WHEN user enters contract amount THEN system SHALL accept values >= 0.001
2. IF user enters a value less than 0.001 THEN system SHALL display validation error "Minimum contract size is 0.001"
3. WHEN displaying contract input THEN system SHALL use step="0.001" for the number input

### Requirement 2: Collateral Estimation Display

**User Story:** As a trader creating a short position RFQ, I want to see the estimated collateral required in USDC, so that I know how much I need before submitting.

#### Acceptance Criteria

1. WHEN user selects short position THEN system SHALL calculate and display estimated collateral
2. IF option type is vanilla PUT THEN system SHALL calculate collateral as: `(numContracts × strike) / 1e8`
3. IF option type is vanilla CALL (inverse) THEN system SHALL calculate collateral as: `numContracts × 1e12` (in underlying token)
4. IF option type is spread THEN system SHALL calculate collateral as: `(numContracts × spreadWidth) / 1e8`
5. IF option type is butterfly/condor THEN system SHALL calculate collateral as: `(numContracts × maxSpreadWidth) / 1e8`
6. WHEN collateral is calculated THEN system SHALL display amount with token symbol (e.g., "~150.00 USDC")
7. IF position is long THEN system SHALL display "No collateral required - you pay premium only"

### Requirement 3: Reserve Price with Limit Order Option

**User Story:** As a trader, I want the option to convert my RFQ to a limit order if no offers arrive, so that my order can still be filled at my reserve price.

#### Acceptance Criteria

1. WHEN reserve price is empty THEN system SHALL display "No reserve price - best offer wins" message
2. IF reserve price is set THEN system SHALL display checkbox "Convert to limit order if no offers"
3. WHEN convertToLimitOrder is checked AND no offers received THEN system SHALL inform user the RFQ becomes a limit order at reserve price
4. IF convertToLimitOrder is unchecked AND no offers received THEN system SHALL inform user the RFQ expires worthless
5. WHEN hovering over limit order checkbox THEN system SHALL display tooltip explaining the behavior

### Requirement 4: Collateral Token Display Based on Option Type

**User Story:** As a trader, I want to see the correct collateral token based on my option type, so that I understand which token I need.

#### Acceptance Criteria

1. IF option type is PUT THEN system SHALL display collateral in USDC
2. IF option type is CALL AND underlying is ETH THEN system SHALL display collateral in WETH
3. IF option type is CALL AND underlying is BTC THEN system SHALL display collateral in cbBTC
4. WHEN collateral token changes THEN system SHALL update the collateral amount display

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: Collateral calculation logic should be in a separate utility function
- **Modular Design**: Collateral display component should be reusable
- **Clear Interfaces**: Use existing formatters from `src/utils/formatters.ts`

### Performance
- Collateral estimation should recalculate within 50ms of input change
- No unnecessary re-renders when form values change

### Usability
- Clear visual indication of estimated collateral
- Informative tooltips for complex concepts (reserve price, limit order conversion)
- Validation messages should be helpful and actionable
