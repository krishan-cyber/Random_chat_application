from email import message
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async


waiting_users = []


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.name = None
        self.partner = None
        self.ready = False  
        self.chat_log = [] 

        client_ip = self.scope["client"][0] if self.scope.get("client") else None
        if client_ip and await self.is_blocked(client_ip):
            await self.close()
            return
        await self.accept()
        

    async def disconnect(self, close_code):
        
        if self.partner:
            await self.partner.send(json.dumps({
                    "type": "system",
                    "message": "disconnected",
                    "name":self.name or "stranger"
                    }))
            self.partner.partner = None 
            self.partner = None 

        if self in waiting_users:
            waiting_users.remove(self)
        
        self.ready = False 
        self.chat_log = []  


    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")
        
        if msg_type == "set_name":
            self.name = data.get("name", "Stranger")
            return

        
        if msg_type == "ready":
            self.ready = True
            if self not in waiting_users: 
                waiting_users.append(self)
            await self.try_pair()
            return
            

       
        if msg_type == "next":  
            if self.partner:
                await self.partner.send(json.dumps({
                    "type": "system",
                    "message": "disconnected",
                    "name":self.name or "stranger"
                    }))
                self.partner.partner = None
                self.partner = None
            

            
            if self in waiting_users:
                waiting_users.remove(self)
            
            self.ready = False 
            self.chat_log = [] 

            return 

        
        if not self.partner:
            return 

        
        if msg_type == "typing": 
            await self.partner.send(json.dumps({
                "type": "typing",
                "name": self.name or 'Stranger'
            }))
            return

       
        if msg_type == "chat":
            message=data.get("message", "")
            log_entry = f"{self.name or 'Stranger'}: {message}"

            self.chat_log.append(log_entry)

            if self.partner:
                self.partner.chat_log.append(log_entry)
    
            await self.partner.send(json.dumps({
                "type": "chat",
                "message": message,
                "name": self.name or 'Stranger'
            }))
            return

       
        if msg_type == "image_request": 
            await self.partner.send(json.dumps({
                "type": "image_request"
            }))
            return

        
        if msg_type == "image": 
            await self.partner.send(json.dumps({
                "type": "image",
                "data": data.get("data", "")
            }))
            return
        if msg_type == "reported":
            if self.partner:
                await self.send(json.dumps({
                    "type": "system",
                    "message": "You reported this chat."
                }))
                try:
                    await self.save_report()
                except Exception as e:
                    await self.send(json.dumps({
                        "type": "system",
                        "message": f"Failed to save report: {str(e)}"
                    }))
            return


    async def try_pair(self):
        
        if not self.ready or self.partner:
            return

        
        for other in list(waiting_users):
            
            if other is not self and other.ready and not other.partner:
                
                if self in waiting_users:
                    
                    waiting_users.remove(self)
                if other in waiting_users:
                    
                    waiting_users.remove(other)

                
                self.partner = other
                other.partner = self

                
                await self.send(json.dumps({
                    "type": "system",
                    "message": f"Connected to {other.name or 'Stranger'}"
                }))
                await other.send(json.dumps({
                    "type": "system",
                    "message": f"Connected to {self.name or 'Stranger'}"
                }))

                
                await self.send(json.dumps({
                    "type": "partner_name",
                    "name": other.name or 'Stranger'
                }))
                await other.send(json.dumps({
                    "type": "partner_name",
                    "name": self.name or 'Stranger'
                }))
                return 
    
    @sync_to_async
    def save_report(self):
        from .models import Report
        if not self.partner:
            return

        reporting_ip = self.scope["client"][0] if self.scope.get("client") else ""
        reported_ip = self.partner.scope["client"][0] if self.partner.scope.get("client") else ""

        Report.objects.create(
            reporting_user=reporting_ip,
            reported_user=reported_ip,
            reported_data="\n".join(self.chat_log)
        )
    @sync_to_async
    def is_blocked(self, ip):
        from .models import BlockedUser
        return BlockedUser.objects.filter(ip=ip).exists()


            