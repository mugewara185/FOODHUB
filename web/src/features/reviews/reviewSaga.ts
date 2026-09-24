import { takeLatest, call, put } from "redux-saga/effects";
import {
  fetchReviewsRequest,
  fetchReviewsSuccess,
  fetchReviewsFailure,
} from "./reviewSlice";
import { fakeFetch } from "@/api/fakeApi";

function* handleFetchReviews(action: ReturnType<typeof fetchReviewsRequest>) {
  try {
    let targetReviews = [];
    if (import.meta.env.DEV) {
      const { reviews } = yield call(() => import("@/data/dummyData"));
      targetReviews = reviews;
    }
    const data = yield call(
      fakeFetch,
      targetReviews.filter((r: any) => r.restaurantId === action.payload)
    );
    yield put(fetchReviewsSuccess(data));
  } catch {
    yield put(fetchReviewsFailure("Failed to fetch reviews"));
  }
}

export function* watchReviewSaga() {
  yield takeLatest(fetchReviewsRequest.type, handleFetchReviews);
}
