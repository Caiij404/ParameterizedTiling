import * as THREE from 'three';

export class TextureEditor {
  private static instance: TextureEditor | null = null;
  private texture: THREE.Texture | null = null;
  private planeTexture: THREE.Texture | null = null;

  private constructor() {
    // 私有构造函数，防止外部实例化
  }

  public static getInstance(): TextureEditor {
    if (!TextureEditor.instance) {
      TextureEditor.instance = new TextureEditor();
    }
    return TextureEditor.instance;
  }

  public initTexture(texturePath: string = '/1.png'): THREE.Texture {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(texturePath);
    
    this.texture = texture;
    this.planeTexture = texture;
    
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    // 设置只使用图片的左半部分作为纹理
    texture.offset.set(0, 0);   // 从左上角开始
    
    // 设置只使用左半部分（水平方向50%），同时重复3次
    // 水平方向：0.5表示只使用左半部分，乘以3表示重复3次左半部分内容
    // 垂直方向：1表示使用全部，乘以3表示重复3次
    texture.repeat.set(1 * 3, 1 * 3);
    
    texture.flipY = false;
    
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    texture.center.set(1, 1);
    texture.rotation = Math.PI / 12;
    
    return texture;
  }

  public rotateTextureRight(angle: number = Math.PI / 90): void {
    if (this.planeTexture) {
      this.planeTexture.rotation += angle;
    }
  }

  public rotateTextureLeft(angle: number = Math.PI / 90): void {
    if (this.planeTexture) {
      this.planeTexture.rotation -= angle;
    }
  }

  public setTextureRepeat(x: number, y: number): void {
    if (this.texture) {
      this.texture.repeat.set(x, y);
    }
  }

  public setTextureRotation(rotation: number): void {
    if (this.texture) {
      this.texture.rotation = rotation;
    }
  }

  public setTextureCenter(x: number, y: number): void {
    if (this.texture) {
      this.texture.center.set(x, y);
    }
  }

  public getTexture(): THREE.Texture | null {
    return this.texture;
  }

  public addKeyboardListeners(): void {
    window.addEventListener("keydown", (e) => {
      if (e.key === "+" || e.key === "=") {
        console.log("+++++++++++++");
        this.rotateTextureRight();
      }
      else if (e.key === "-" || e.key === "_") {
        console.log("----------");
        this.rotateTextureLeft();
      }
    });
  }
}