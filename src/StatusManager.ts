const zone1 = 'zone1';
const zone2 = 'zone2';
const zone3 = 'zone3';


export class StatusManager{
    private static instance: StatusManager;
    private onHoverZone: string = '';
    private existZone: string [] = [];
    private lineCreationStatus: string = '';
    private constructor(){

    }

    public static get(): StatusManager{
        if(!this.instance)
        {
            this.instance = new StatusManager();
        }
        return this.instance;
    }

    updateZone(){

    }

    setHoverZone(s: string = ''){
        this.onHoverZone = s;
    }

    getHoverZone(): string{
        return this.onHoverZone;
    }

    setLineCreationStatus(s: string = ''){
        this.lineCreationStatus = s;
    }

    getLineCreationStatus(): string{
        return this.lineCreationStatus;
    }



}