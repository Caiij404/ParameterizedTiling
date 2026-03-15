type callbackFunc = (object: any)=> void;

class SubEntity
{
	topic: string = "";
	id: number = 0;
	callback: callbackFunc | undefined = undefined;
}

class SubQueue
{
	topic: string = "";
	subEntities: Array<SubEntity> = new Array<SubEntity>;
	addSubEntity(ent: SubEntity)
	{
		if(!ent)
		{
			return ;
		}
		this.subEntities.push(ent);
	}
	removeSubEntity(id: number)
	{
		for(let i=0; i<this.subEntities.length; ++i)
		{
			let ent = this.subEntities[i];
			if(!ent)
				continue;
			if(id == ent.id)
			{
				this.subEntities.splice(i,1);
				return;
			}
		}
	}
}
				
let globalId = 1;
let topicMap = new Map<string, SubQueue>;

export namespace EventBus
{
	export function pub(topic: string, pubObj: any)
	{
		if(!topic || !topic.length)
		{
			return ;
		}
		let queue = topicMap.get(topic);
		if(!queue)
		{
			return;
		}
		queue.subEntities.forEach((subEnt) => {
			if(subEnt.callback)
			{
				subEnt.callback(pubObj);
			}
		});
	}
	export function sub(topic: string, callback: callbackFunc) : number
	{
		if(!callback)
			return -1;
		let queue = topicMap.get(topic);
		if(!queue)
		{
			queue = new SubQueue();
			queue.topic = topic;
			topicMap.set(topic, queue);
		}
		let entity = new SubEntity();
		entity.topic = topic;
		entity.id = globalId++;
		entity.callback = callback;
		queue.addSubEntity(entity);
		return entity.id;
	}
	export function unsub(topic: string, id: number)
	{
		let queue = topicMap.get(topic);
		if(!queue)
			return;
		queue.removeSubEntity(id);
	}
}