import { drawSketchPage, loadSketchHand, type Side } from './pages';

var _reply = (id: number, side: Side) =>
  ((bitmap) => postMessage({ id, bitmap }, { transfer: [bitmap] }))(
    drawSketchPage(side).transferToImageBitmap()
  );

addEventListener(
  'message',
  ({ data: { id, side } }: MessageEvent<{ id: number; side: Side }>) =>
    void loadSketchHand().then(
      () => _reply(id, side),
      () => postMessage({ id, error: 'fonts' })
    )
);
