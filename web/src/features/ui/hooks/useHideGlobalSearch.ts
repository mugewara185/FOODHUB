import { useEffect } from 'react';
import { useAppDispatch } from '../../../app/store/hooks';
import { setGlobalSearchHidden } from '../uiSlice';

export const useHideGlobalSearch = (hide: boolean = true) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setGlobalSearchHidden(hide));
    
    // Cleanup on unmount
    return () => {
      dispatch(setGlobalSearchHidden(false));
    };
  }, [hide, dispatch]);
};
