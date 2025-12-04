import { Suspense } from 'react';
import View from './view';

export default function ViewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading PDF viewer...</div>}>
      <View />
    </Suspense>
  );
}
