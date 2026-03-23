# Tasks Document: RFQ Trading Page

## Phase 1: Foundation & Types

- [x] 1. Create RFQ type definitions
  - File: `src/types/rfq.ts`
  - Define TypeScript interfaces for RFQ form state, transaction state, and component props
  - Export types for use across all RFQ components
  - Purpose: Establish type safety for entire RFQ feature
  - _Leverage: SDK types from `@thetanuts-finance/thetanuts-client`_
  - _Requirements: All requirements (type foundation)_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer specializing in type systems | Task: Create comprehensive TypeScript interfaces for RFQ feature including RFQFormState, TransactionState, DecryptedOfferDisplay, and all component prop interfaces. Import and re-export relevant SDK types (StateRfq, StateOffer, RFQKeyPair, etc.) | Restrictions: Do not duplicate SDK types, only extend/wrap them. Follow existing project naming conventions. Keep file focused on types only, no runtime code | Success: All interfaces compile without errors, full type coverage for RFQ components, proper imports from SDK | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 2. Create shared formatting utilities
  - File: `src/utils/formatters.ts`
  - Implement formatStrike, formatExpiry, formatPrice, formatCountdown utilities
  - Extract existing formatting from OrdersTable.tsx and make reusable
  - Purpose: Share formatting logic between Orderbook and RFQ components
  - _Leverage: Existing formatters in `src/components/OrdersTable.tsx` lines 44-67_
  - _Requirements: Usability (human-readable values)_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Utility Developer | Task: Extract and create shared formatting utilities from OrdersTable.tsx. Create functions: formatStrike(strike: bigint), formatExpiry(expiry: bigint), formatPrice(price: bigint), formatCountdown(deadline: number), formatAddress(address: string) | Restrictions: Do not break existing OrdersTable.tsx - update it to use new utilities after creating them. Maintain 8 decimal precision for prices/strikes | Success: All formatters work correctly, OrdersTable updated to use shared utilities, no breaking changes | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

## Phase 2: Core Hook

- [x] 3. Create useRFQ hook - Core state and SDK integration
  - File: `src/hooks/useRFQ.ts`
  - Implement hook with state management for activeRfqs, historyRfqs, loading, error
  - Add fetchUserRFQs, refreshRFQs methods using client.api.getUserRfqs
  - Purpose: Centralize RFQ state management and SDK calls
  - _Leverage: `src/hooks/useThetanutsClient.ts` pattern, SDK's `client.api` module_
  - _Requirements: 2.1, 2.2, 6.1, 6.2_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Hooks Developer with Web3 experience | Task: Create useRFQ hook with core state management. Include: activeRfqs/historyRfqs state arrays, loading/error states, fetchUserRFQs(address) method that calls client.api.getUserRfqs and separates by status, refreshRFQs() method | Restrictions: Follow useThetanutsClient pattern, handle API errors gracefully, memoize where appropriate | Success: Hook fetches and categorizes RFQs correctly, handles loading/error states, re-renders efficiently | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 4. Add RFQ creation methods to useRFQ hook
  - File: `src/hooks/useRFQ.ts` (continue)
  - Implement createRFQ method using client.optionFactory.buildRFQRequest and encodeRequestForQuotation
  - Add ensureKeyPair method using client.rfqKeys.getOrCreateKeyPair
  - Handle collateral approval for short positions
  - Purpose: Enable RFQ creation from form
  - _Leverage: SDK's `client.optionFactory`, `client.rfqKeys`, `client.erc20` modules_
  - _Requirements: 1.1-1.12, 8.1-8.4_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Web3 Frontend Developer | Task: Add createRFQ method to useRFQ hook. Steps: 1) Call ensureKeyPair to get/create keys, 2) Build RFQ params using appropriate builder (buildRFQRequest, buildSpreadRFQ, etc based on structure), 3) For short positions, call client.erc20.ensureAllowance for collateral, 4) Encode and submit transaction, 5) Return RFQ ID. Also add ensureKeyPair wrapper method | Restrictions: Use SDK builder methods, don't manually construct params. Handle all option structures (vanilla, spread, butterfly, condor, iron-condor) | Success: RFQ creation works for all structures, collateral approval handled, keys managed automatically | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 5. Add settle, cancel, and offer methods to useRFQ hook
  - File: `src/hooks/useRFQ.ts` (continue)
  - Implement settleRFQ using client.optionFactory.settleQuotation
  - Implement cancelRFQ using client.optionFactory.cancelQuotation
  - Implement getOffersForRFQ using client.api.getRfq
  - Implement decryptOffer using client.rfqKeys.decryptOffer
  - Purpose: Complete RFQ lifecycle management
  - _Leverage: SDK's `client.optionFactory`, `client.api`, `client.rfqKeys` modules_
  - _Requirements: 3.1-3.5, 4.1-4.5, 5.1-5.4_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Web3 Frontend Developer | Task: Add remaining lifecycle methods to useRFQ: settleRFQ(quotationId) - calls settleQuotation, cancelRFQ(quotationId) - calls cancelQuotation, getOffersForRFQ(rfqId) - fetches RFQ with offers, decryptOffer(offer) - decrypts using rfqKeys and returns DecryptedOfferDisplay | Restrictions: Handle errors gracefully, return meaningful error messages, check preconditions (e.g., can't cancel with offers) | Success: All lifecycle operations work correctly, proper error handling, UI can use these methods | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 6. Add WebSocket subscription to useRFQ hook
  - File: `src/hooks/useRFQ.ts` (continue)
  - Implement subscribeToRFQ method using client.ws.subscribeToRfq
  - Handle onOfferMade, onOfferRevealed, onSettled, onCancelled callbacks
  - Auto-update state when events received
  - Purpose: Enable real-time updates for active RFQs
  - _Leverage: SDK's `client.ws` module_
  - _Requirements: 7.1-7.6_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Developer with WebSocket experience | Task: Add subscribeToRFQ(quotationId, callbacks) method that wraps client.ws.subscribeToRfq. Internal callbacks should update hook state (refresh RFQ data on events). Return unsubscribe function. Handle connection errors with onError callback | Restrictions: Clean up subscriptions properly, don't create memory leaks, handle reconnection gracefully | Success: Real-time updates work, state updates on events, proper cleanup on unmount | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

## Phase 3: UI Components

- [x] 7. Create TabNavigation component
  - File: `src/components/TabNavigation.tsx`
  - Implement tab buttons for switching between Orderbook and RFQ
  - Style with Tailwind matching existing dark theme
  - Purpose: Enable navigation between trading modes
  - _Leverage: Button styles from `src/components/OrdersTable.tsx`_
  - _Requirements: UI Navigation_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React UI Developer | Task: Create TabNavigation component with props: activeTab ('orderbook' | 'rfq'), onTabChange callback. Render two tab buttons styled as pills/segments. Active tab: bg-blue-600 text-white, inactive: bg-gray-700 text-gray-300 hover:bg-gray-600 | Restrictions: Keep component simple and focused, use Tailwind only, match existing dark theme | Success: Tabs render correctly, clicking changes active state, smooth transitions | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 8. Create ExpiryPicker component
  - File: `src/components/ExpiryPicker.tsx`
  - Implement date picker that only allows Friday 8:00 UTC selections
  - Show next 4 valid expiry dates as quick-select buttons
  - Purpose: Ensure valid option expiry dates
  - _Leverage: Input styles from `src/components/OrdersTable.tsx`_
  - _Requirements: 1.8 (expiry validation)_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React UI Developer | Task: Create ExpiryPicker component with props: value (timestamp), onChange callback, minDate (optional). Calculate next 4 Friday 8:00 UTC dates and show as quick-select buttons. Also allow custom date input (validate it's Friday 8:00 UTC). Show error for invalid dates | Restrictions: All expiries must be Friday 8:00 UTC, no past dates, clear validation feedback | Success: Only valid dates selectable, quick-select works, clear error messages for invalid input | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 9. Create RFQCreateForm component
  - File: `src/components/RFQCreateForm.tsx`
  - Implement form with all RFQ parameters (structure, underlying, strikes, expiry, etc.)
  - Add client-side validation for all fields
  - Show preview section with estimated costs
  - Handle form submission with transaction status
  - Purpose: Enable users to create RFQ requests
  - _Leverage: Form patterns from `src/components/OrdersTable.tsx` lines 237-330, ExpiryPicker_
  - _Requirements: 1.1-1.12_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Forms Developer | Task: Create RFQCreateForm with props: client, address, onSuccess. Include: structure dropdown (vanilla/spread/butterfly/condor/iron-condor), underlying toggle (ETH/BTC), optionType toggle (CALL/PUT), dynamic strike inputs based on structure, ExpiryPicker, numContracts input, isLong toggle, collateralToken dropdown, offerDeadlineMinutes input, reservePrice input (optional). Add preview section showing estimated collateral. Handle submission with loading states | Restrictions: Validate all inputs before submission, show clear error messages, follow existing form patterns | Success: Form captures all parameters, validates correctly, submits successfully, shows transaction status | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 10. Create OffersList component
  - File: `src/components/OffersList.tsx`
  - Display list of offers for an RFQ
  - Attempt decryption using useRFQ hook
  - Sort by best price, highlight best offer
  - Purpose: Show market maker offers to requester
  - _Leverage: Card styles from existing components, useRFQ.decryptOffer_
  - _Requirements: 3.1-3.6_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React UI Developer | Task: Create OffersList with props: offers (StateOffer[]), client, rfqIsLong. On mount, attempt to decrypt each offer using client.rfqKeys.decryptOffer. Display: offeror address (truncated), decrypted amount or "Encrypted" placeholder, status badge. Sort decrypted offers by price (best first based on position). Highlight best offer with "BEST" badge | Restrictions: Handle decryption failures gracefully, don't block render on decryption, show loading state per offer | Success: Offers display correctly, decryption works, sorted properly, best offer highlighted | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 11. Create RFQCard component
  - File: `src/components/RFQCard.tsx`
  - Implement expandable card showing RFQ details
  - Include countdown timer for offer deadline
  - Show Settle/Cancel buttons based on state
  - Embed OffersList when expanded
  - Purpose: Display individual RFQ with actions
  - _Leverage: Expandable row pattern from `src/components/OrdersTable.tsx` lines 202-331_
  - _Requirements: 2.1-2.5, 4.1-4.4, 5.1-5.4_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React UI Developer | Task: Create RFQCard with props: rfq (StateRfq), client, isExpanded, onToggle, onSettle, onCancel. Display: RFQ ID, underlying, optionType badge, strikes, expiry, contracts, position, countdown to deadline, offer count. When expanded, show OffersList. Show Cancel button if no offers and in offer period. Show Settle button if deadline passed and has offers | Restrictions: Follow expandable pattern from OrdersTable, handle all RFQ states, clear action button states | Success: Card displays all info, expands/collapses smoothly, actions work correctly, countdown updates | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 12. Create RFQList component
  - File: `src/components/RFQList.tsx`
  - Display list of active RFQs using RFQCard
  - Manage expanded state
  - Handle settle/cancel actions
  - Subscribe to WebSocket updates for each RFQ
  - Purpose: Show all active RFQ requests
  - _Leverage: List pattern from `src/components/OrdersTable.tsx`, useRFQ hook_
  - _Requirements: 2.1-2.5, 7.1-7.6_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React UI Developer | Task: Create RFQList with props: client, address, onRFQSettled. Use useRFQ hook to get activeRfqs. Map to RFQCard components. Manage expandedRfqId state. On mount, subscribe to WebSocket for each active RFQ. Handle settle/cancel with loading states, refresh list after actions | Restrictions: Clean up WebSocket subscriptions on unmount, handle empty state, show loading during actions | Success: List displays RFQs, expand/collapse works, actions complete successfully, real-time updates work | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 13. Create RFQHistory component
  - File: `src/components/RFQHistory.tsx`
  - Display settled and cancelled RFQs
  - Show final settlement details for settled RFQs
  - Link to BaseScan for option contracts
  - Purpose: Track RFQ trading history
  - _Leverage: Table layout from `src/components/OrdersTable.tsx`, useRFQ hook_
  - _Requirements: 6.1-6.4_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React UI Developer | Task: Create RFQHistory with props: client, address. Use useRFQ hook to get historyRfqs. Display table with: RFQ ID, underlying, strikes, expiry, status badge (settled=green, cancelled=red), settlement price (if settled), option address link (if settled). Clicking row expands to show full details | Restrictions: Handle empty state, external links open in new tab, clear status distinction | Success: History displays correctly, links work, expandable details show full info | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 14. Create RFQPage container component
  - File: `src/components/RFQPage.tsx`
  - Container with sub-navigation (Create, Active, History tabs)
  - Render appropriate child component based on active sub-tab
  - Handle navigation after RFQ creation (go to Active tab)
  - Purpose: Main RFQ page container
  - _Leverage: All RFQ child components_
  - _Requirements: All RFQ requirements_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React UI Developer | Task: Create RFQPage with props: client, address, isConnected, isCorrectNetwork. Include sub-navigation pills for Create/Active/History. Render RFQCreateForm, RFQList, or RFQHistory based on activeSubTab state. Pass onSuccess to form that switches to Active tab. Show connect prompt if not connected | Restrictions: Consistent styling with rest of app, clear navigation, handle wallet not connected | Success: Sub-navigation works, correct component renders, navigation after actions works | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

## Phase 4: Integration

- [x] 15. Update App.tsx with tab navigation
  - File: `src/App.tsx` (modify)
  - Add TabNavigation component to header area
  - Add state for activeTab
  - Conditionally render OrdersTable or RFQPage based on tab
  - Purpose: Integrate RFQ page into main application
  - _Leverage: Existing `src/App.tsx` structure_
  - _Requirements: Integration_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Developer | Task: Update App.tsx to include tab navigation. Add activeTab state ('orderbook' | 'rfq'). Add TabNavigation below header. In main content, conditionally render OrdersTable (when orderbook) or RFQPage (when rfq). Pass all required props to both | Restrictions: Don't break existing OrdersTable functionality, maintain layout structure, keep sidebar | Success: Tab navigation works, both pages render correctly, no regressions | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 16. Update OrdersTable to use shared formatters
  - File: `src/components/OrdersTable.tsx` (modify)
  - Import formatters from `src/utils/formatters.ts`
  - Replace inline formatting functions with shared utilities
  - Purpose: Consolidate formatting logic
  - _Leverage: `src/utils/formatters.ts` created in task 2_
  - _Requirements: Code Architecture (modularity)_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Developer | Task: Update OrdersTable.tsx to use shared formatters. Import formatStrike, formatExpiry, formatPrice from utils/formatters.ts. Remove local formatStrike, formatExpiry, formatPrice functions. Update all usages to use imported utilities | Restrictions: No functional changes, just refactor to use shared utilities, ensure all displays unchanged | Success: OrdersTable uses shared formatters, displays unchanged, no errors | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

## Phase 5: Testing & Polish

- [x] 17. Add error boundary and loading states
  - Files: All RFQ components
  - Ensure all components handle loading and error states gracefully
  - Add retry buttons for failed API calls
  - Verify WebSocket reconnection logic
  - Purpose: Improve reliability and user experience
  - _Leverage: Error handling patterns from `src/components/OrdersTable.tsx`_
  - _Requirements: Reliability, Error Handling_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Developer | Task: Review all RFQ components and ensure: 1) Loading states show spinner/skeleton, 2) Error states show message with retry button, 3) WebSocket disconnection shows status indicator, 4) Empty states show helpful message with CTA. Add any missing error handling | Restrictions: Consistent error UI across components, don't swallow errors silently, log errors to console | Success: All components handle loading/error gracefully, retry works, good user feedback | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 18. Add tooltips and help text
  - Files: RFQCreateForm, RFQCard
  - Add tooltips explaining option structures, parameters
  - Add help text for complex inputs (strikes, expiry)
  - Purpose: Improve usability for new users
  - _Leverage: Existing tooltip styles if any, or create simple hover tooltip_
  - _Requirements: Usability_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: UX Developer | Task: Add helpful tooltips/help text to RFQCreateForm: explain each structure type (vanilla=single strike, spread=2 strikes for directional, etc.), explain Long vs Short positions, explain reserve price, explain offer deadline. Use title attribute or create simple tooltip component | Restrictions: Keep tooltips concise, don't clutter UI, tooltips should enhance not distract | Success: Users can understand all form fields, tooltips are helpful and non-intrusive | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_

- [x] 19. Final integration testing and cleanup
  - Files: All files
  - Test complete RFQ flow end-to-end
  - Verify all requirements are met
  - Clean up any console logs, unused imports
  - Ensure TypeScript strict mode passes
  - Purpose: Ensure feature is production-ready
  - _Leverage: All implemented components_
  - _Requirements: All_
  - _Prompt: Implement the task for spec rfq-trading-page, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Developer | Task: Perform final testing: 1) Test create RFQ for each structure type, 2) Test view active RFQs, 3) Test offer decryption, 4) Test settle flow, 5) Test cancel flow, 6) Test history view, 7) Verify real-time updates. Clean up: remove console.logs, fix any TypeScript errors, ensure no unused imports. Run npm run build to verify | Restrictions: Don't add new features, only fix issues found, ensure build passes | Success: All flows work correctly, build passes, no console errors, TypeScript strict passes | After implementation: Mark task [-] as in-progress in tasks.md before starting, use log-implementation tool to record what was created, then mark [x] as complete_
