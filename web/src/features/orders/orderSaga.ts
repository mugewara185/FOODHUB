import { takeLatest, call, put } from "redux-saga/effects";
import {
  fetchOrdersRequest,
  fetchOrdersSuccess,
  fetchOrdersFailure,
} from "./orderSlice";
// import { orders } from "@/data/dummyData";
// import { fakeFetch } from "@/api/fakeApi";
import { apiClient } from "@/services/http/apiClient";

function* handleFetchOrders(action: ReturnType<typeof fetchOrdersRequest>) {
  try {
    // Real API call - fetches user's orders
    const data = yield call(() => apiClient.get("/orders"));
    yield put(fetchOrdersSuccess(data));
  } catch (error) {
    // Fallback to dummy data for development
    // const data = yield call(
    //   fakeFetch,
    //   orders.filter((o) => o.userId === action.payload)
    // );
    // yield put(fetchOrdersSuccess(data));
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    yield put(fetchOrdersFailure(message));
  }
}

export function* watchOrderSaga() {
  yield takeLatest(fetchOrdersRequest.type, handleFetchOrders);
}
