import { takeLatest, call, put } from "redux-saga/effects";
import {
  fetchReviewsRequest,
  fetchReviewsSuccess,
  fetchReviewsFailure,
} from "./reviewSlice";
// import { reviews } from "@/data/dummyData";
// import { fakeFetch } from "@/api/fakeApi";
import { apiClient } from "@/services/http/apiClient";

function* handleFetchReviews(action: ReturnType<typeof fetchReviewsRequest>) {
  try {
    // Real API call
    const data = yield call(
      () => apiClient.get(`/reviews/restaurant/${action.payload}`)
    );
    yield put(fetchReviewsSuccess(data));
  } catch (error) {
    // Fallback to dummy data for development
    // const data = yield call(
    //   fakeFetch,
    //   reviews.filter((r) => r.restaurantId === action.payload)
    // );
    // yield put(fetchReviewsSuccess(data));
    const message = error instanceof Error ? error.message : "Failed to fetch reviews";
    yield put(fetchReviewsFailure(message));
  }
}

export function* watchReviewSaga() {
  yield takeLatest(fetchReviewsRequest.type, handleFetchReviews);
}
