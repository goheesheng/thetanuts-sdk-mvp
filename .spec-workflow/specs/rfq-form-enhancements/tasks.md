# Tasks Document: RFQ Form Enhancements

## Phase 1: Core Utilities

- [x] 1. Create collateral calculation utility
  - File: `src/utils/collateral.ts`
  - Implement calculateCollateral function for all option structures
  - Return amount, token symbol, and formula description
  - Purpose: Centralize collateral estimation logic
  - _Leverage: SDK collateral formulas from documentation_
  - _Requirements: 2.1-2.6, 4.1-4.4_
  - _Prompt: Implement the task for spec rfq-form-enhancements, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Utility Developer | Task: Create calculateCollateral utility function that calculates estimated collateral based on option type (PUT/CALL), underlying (ETH/BTC), structure (vanilla/spread/butterfly/condor), strikes array, and numContracts. Return CollateralResult with amount, token (USDC or WETH or cbBTC), and formula string. Formulas: PUT = (contracts times strike) / 1e8, CALL = contracts (in underlying token), Spread = (contracts times spreadWidth) / 1e8, Butterfly/Condor = (contracts times maxSpread) / 1e8 | Restrictions: Do not call SDK directly, this is estimation only. Handle edge cases (zero strikes, invalid inputs). Keep it pure function | Success: Function returns correct collateral for all option types and structures, includes human-readable formula | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 2. Update RFQ types with new fields
  - File: `src/types/rfq.ts` (modify)
  - Add convertToLimitOrder field to RFQFormState
  - Update DEFAULT_RFQ_FORM with new default
  - Purpose: Support limit order conversion option
  - _Leverage: Existing RFQFormState interface_
  - _Requirements: 3.1-3.5_
  - _Prompt: Implement the task for spec rfq-form-enhancements, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer | Task: Add convertToLimitOrder: boolean field to RFQFormState interface. Update DEFAULT_RFQ_FORM to include convertToLimitOrder: false. No other changes needed | Restrictions: Do not modify other fields, maintain backward compatibility | Success: Types compile without errors, default form includes new field | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

## Phase 2: UI Components

- [x] 3. Create CollateralEstimate component
  - File: `src/components/CollateralEstimate.tsx`
  - Display estimated collateral for short positions
  - Show "No collateral required" for long positions
  - Include formula explanation tooltip
  - Purpose: Show users collateral requirements before RFQ creation
  - _Leverage: `src/utils/collateral.ts`, `src/components/Tooltip.tsx`, `src/utils/formatters.ts`_
  - _Requirements: 2.1-2.7, 4.1-4.4_
  - _Prompt: Implement the task for spec rfq-form-enhancements, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React UI Developer | Task: Create CollateralEstimate component with props: isLong, optionType, underlying, structure, strikes, numContracts. If isLong, show "No collateral required - you pay premium only". If short, call calculateCollateral and display "~{amount} {token}" with HelpIcon tooltip showing formula. Show warning "Actual amount determined at settlement" | Restrictions: Use existing Tailwind classes matching app theme (bg-gray-800, text-gray-400, etc.), use HelpIcon from Tooltip.tsx | Success: Component displays correct collateral estimate, updates when inputs change, matches app styling | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 4. Update RFQCreateForm with collateral display
  - File: `src/components/RFQCreateForm.tsx` (modify)
  - Add CollateralEstimate component to preview section
  - Update contract input minimum to 0.001 with step="0.001"
  - Purpose: Show collateral estimate in form
  - _Leverage: `src/components/CollateralEstimate.tsx`_
  - _Requirements: 1.1-1.3, 2.1-2.7_
  - _Prompt: Implement the task for spec rfq-form-enhancements, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Forms Developer | Task: 1) Import CollateralEstimate component. 2) Update contracts input: change min from 0.01 to 0.001, change step from 0.01 to 0.001. 3) Add CollateralEstimate to the preview section (after the existing preview content), passing form values as props. 4) Update validation to check numContracts >= 0.001 | Restrictions: Keep existing preview content, just add collateral below it. Don't change other form behavior | Success: Contracts accept 0.001 minimum, collateral estimate shows in preview, validation works | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 5. Add limit order conversion option to form
  - File: `src/components/RFQCreateForm.tsx` (modify)
  - Add convertToLimitOrder checkbox below reserve price
  - Only show when reserve price is set
  - Include explanatory text
  - Purpose: Enable limit order conversion feature
  - _Leverage: `src/components/Tooltip.tsx`_
  - _Requirements: 3.1-3.5_
  - _Prompt: Implement the task for spec rfq-form-enhancements, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Forms Developer | Task: Add limit order section below reserve price input. 1) Only render when form.reservePrice is set (greater than 0). 2) Add checkbox input bound to form.convertToLimitOrder. 3) Label: "Convert to limit order if no offers". 4) Below checkbox, add small text: "If enabled, your RFQ becomes a limit order at your reserve price when the offer deadline passes with no offers received." 5) Add HelpIcon tooltip on label: "Without this, RFQ expires worthless if no offers. With this, it becomes a limit order that can be filled later." | Restrictions: Match existing form styling, use updateForm helper for state | Success: Checkbox appears only when reserve price set, updates form state, clear explanation text | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

## Phase 3: Hook Integration

- [x] 6. Update useRFQ hook to pass convertToLimitOrder
  - File: `src/hooks/useRFQ.ts` (modify)
  - Pass convertToLimitOrder to SDK when creating RFQ
  - Purpose: Enable limit order conversion in SDK call
  - _Leverage: SDK buildRFQRequest and related functions_
  - _Requirements: 3.1-3.5_
  - _Prompt: Implement the task for spec rfq-form-enhancements, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Web3 Frontend Developer | Task: Update the createRFQ function in useRFQ hook to pass convertToLimitOrder from form state to the SDK. Find where buildRFQRequest or similar SDK function is called and add convertToLimitOrder parameter. The SDK accepts this as a boolean field | Restrictions: Only modify the createRFQ function, don't change other hook methods | Success: convertToLimitOrder is passed to SDK, RFQ creation still works | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

## Phase 4: Testing & Polish

- [x] 7. Test and verify all changes
  - Files: All modified files
  - Run build to verify no TypeScript errors
  - Test form with various option configurations
  - Verify collateral calculations match SDK formulas
  - Purpose: Ensure feature works correctly
  - _Leverage: All implemented components_
  - _Requirements: All_
  - _Prompt: Implement the task for spec rfq-form-enhancements, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Developer | Task: 1) Run npm run build to verify no TypeScript errors. 2) Test collateral calculation for each structure type (vanilla PUT, vanilla CALL, spread, butterfly, condor). 3) Verify contract input accepts 0.001. 4) Verify limit order checkbox appears only when reserve price is set. 5) Fix any issues found | Restrictions: Don't add new features, only fix issues | Success: Build passes, all features work as designed, no console errors | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_
