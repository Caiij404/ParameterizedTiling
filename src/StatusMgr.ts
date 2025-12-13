export enum cursorStatus {
    default = 0,// 默认光标
    crosshair,  // 十字星 
}

export enum cameraStatus {
    CAMERA2D = 0, // 默认相机
    CAMERA3D ,       // 轨道相机
}

/**
 * 状态管理类
 */
export class StatusMgr {
    static getCursorStatus() {
        throw new Error('Method not implemented.');
    }
    public static ins: StatusMgr = new StatusMgr();
    private cursorStatus: cursorStatus = cursorStatus.default;
    private cameraStatus: cameraStatus = cameraStatus.CAMERA2D;
    public static getInstance(): StatusMgr {
        return this.ins;
    }
    private constructor(){}

    public setDefaultCursor(): void {
        this.cursorStatus = cursorStatus.default;
    }
    public setCursorStatus(status: cursorStatus): void {
        this.cursorStatus = status;
    }
    public getCursorStatus(): cursorStatus {
        return this.cursorStatus;
    }
    
    public setCameraStatus(status: cameraStatus): void {
        this.cameraStatus = status;
    }
    public getCameraStatus(): cameraStatus {
        return this.cameraStatus;
    }

}