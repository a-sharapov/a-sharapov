export class GlyphPreview {
  hovered = $state(false);
  held = $state(false);

  look = (on: boolean) => (on !== (this.hovered && !this.held) ? 'on' : 'off');

  enter = (event: PointerEvent) =>
    void (this.hovered = event.pointerType === 'mouse');

  leave = () => void ((this.hovered = false), (this.held = false));

  hold = () => void (this.held = true);
}
