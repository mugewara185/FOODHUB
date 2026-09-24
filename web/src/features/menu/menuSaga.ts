import { takeLatest, call, put } from "redux-saga/effects";
import {
  fetchMenuRequest,
  fetchMenuSuccess,
  fetchMenuFailure,
} from "./menuSlice";
import { fakeFetch } from "@/api/fakeApi";

function* handleFetchMenu(action: ReturnType<typeof fetchMenuRequest>) {
  try {
    let targetMenus = [];
    if (import.meta.env.DEV) {
      const { menus } = yield call(() => import("@/data/dummyData"));
      targetMenus = menus;
    }
    const data = yield call(
      fakeFetch,
      targetMenus.filter((m: any) => m.restaurantId === action.payload)
    );
    yield put(fetchMenuSuccess(data));
  } catch {
    yield put(fetchMenuFailure("Failed to load menu"));
  }
}

export function* watchMenuSaga() {
  yield takeLatest(fetchMenuRequest.type, handleFetchMenu);
}
