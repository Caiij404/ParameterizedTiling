export enum cursorStatus {
    default = 0,
    crosshair,
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
}