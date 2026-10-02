import type { Screen } from "./screen.js";

export interface Scene {
  readonly id: string;

  update(dt: number): void;

  draw(screen: Screen): void;
  enter?(): void;
  exit?(): void;
}

export class SceneStack {
  private readonly scenes: Scene[] = [];

  constructor(private readonly root: HTMLElement) {
  }
  get current(): Scene | undefined {
    return this.scenes.at(-1);
  }

  push(scene: Scene): void {
    this.scenes.push(scene);
    scene.enter?.();
    this.sync();
  }

  pop(): void {
    this.scenes.pop()?.exit?.();
    this.sync();
  }

  replace(scene: Scene): void {
    this.scenes.pop()?.exit?.();
    this.push(scene);
  }

  update(dt: number): void {
    this.current?.update(dt);
  }

  draw(screen: Screen): void {
    this.current?.draw(screen);
  }

  private sync(): void {
    this.root.dataset.scene = this.current?.id ?? "loading";
  }
}
