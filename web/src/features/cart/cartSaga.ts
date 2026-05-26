import { takeLatest, call, put } from "redux-saga/effects";
import { apiClient } from "@/services/http/apiClient";
// TODO: Add cart-related actions to handle creating and updating orders
// These sagas will sync cart data to backend when needed

export function* watchCartSaga() {
  // reserved for side-effects like syncing cart to backend
  // Example: yield takeLatest(createOrderRequest.type, handleCreateOrder);
}

