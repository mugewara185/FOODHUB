import { takeLatest, call, put } from "redux-saga/effects";
import {
  fetchRestaurantsRequest,
  fetchRestaurantsSuccess,
  fetchRestaurantsFailure,
} from "./restaurantSlice";
// import { restaurants } from "@/data/dummyData";
// import { fakeFetch } from "@/api/fakeApi";
import { apiClient } from "@/services/http/apiClient";

function* handleFetchRestaurants() {
  try {
    // Real API call
    const data = yield call(() => apiClient.get("/restaurants"));
    yield put(fetchRestaurantsSuccess(data));
  } catch (error) {
    // Fallback to dummy data for development
    // const data = yield call(fakeFetch, restaurants);
    // yield put(fetchRestaurantsSuccess(data));
    const message = error instanceof Error ? error.message : "Failed to fetch restaurants";
    yield put(fetchRestaurantsFailure(message));
  }
}

export function* watchRestaurantSaga() {
  yield takeLatest(fetchRestaurantsRequest.type, handleFetchRestaurants);
}

