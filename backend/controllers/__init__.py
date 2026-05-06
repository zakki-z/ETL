from .server_controller import router as server_router
from .partner_controller import router as partner_router
from .flow_controller import router as flow_router
from .processing_controller import router as processing_router
from .bosco_controller import router as bosco_router
from .copilot_controller import router as copilot_router
from .migration_controller import router as migration_router
from .remote_server_controller import router as remote_server_router
from .network_config_controller import router as network_config_router

all_routers = [
    server_router,
    partner_router,
    flow_router,
    processing_router,
    bosco_router,
    copilot_router,
    migration_router,
    remote_server_router,
    network_config_router,
]