import { takeLatest, call, put } from "redux-saga/effects";
import {
  fetchMenuRequest,
  fetchMenuSuccess,
  fetchMenuFailure,
} from "./menuSlice";
// import { menus } from "@/data/dummyData";
// import { fakeFetch } from "@/api/fakeApi";
import { apiClient } from "@/services/http/apiClient";

function* handleFetchMenu(action: ReturnType<typeof fetchMenuRequest>) {
  try {
    // Real API call
    const data = yield call(
      () => apiClient.get(`/restaurants/${action.payload}`)
    );
    yield put(fetchMenuSuccess(data));
  } catch (error) {
    // Fallback to dummy data for development
    // const data = yield call(
    //   fakeFetch,
    //   menus.filter((m) => m.restaurantId === action.payload)
    // );
    // yield put(fetchMenuSuccess(data));
    const message = error instanceof Error ? error.message : "Failed to load menu";
    yield put(fetchMenuFailure(message));
  }
}

export function* watchMenuSaga() {
  yield takeLatest(fetchMenuRequest.type, handleFetchMenu);
}
