import { Line } from "./Line";
import * as PIXI from 'pixi.js';

export class Movement{
    private static instance: Movement;
    private line: Line | undefined;
    private constructor(){}

    public static get():Movement{
        if(!this.instance)
        {
            this.instance = new Movement();
        }
        return this.instance;
    }

    public setMoveStart(line: Line)
    {
        this.line = line;
    }

    public setMoving(point: PIXI.IPointData)
    {
        
    }
}