from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
import asyncio
import os

async def getGoogleAccounts(db, businessID):
    try:
        print('called')
        docref = db.collection('businesses').document(businessID)
        doc = await docref.get()
        
        data = doc.to_dict()
        refresh_token = data.get('refreshToken')

        print(refresh_token)
        
        client_id = os.environ.get('CLIENT_ID')
        client_secret = os.environ.get('CLIENT_SECRET')
        developer_token = os.environ.get('DEVELOPER_TOKEN')

        config = {
            "client_id": client_id,
            "client_secret": client_secret,
            "developer_token": developer_token,
            "refresh_token": refresh_token,
            "use_proto_plus": True,
        }

        print(config)

        google_ads_client = GoogleAdsClient.load_from_dict(config)
        customer_service = google_ads_client.get_service("CustomerService")
        accessible_customers = customer_service.list_accessible_customers()

        final_array = [{"name": account} for account in accessible_customers.resource_names]
        return final_array

    except GoogleAdsException as ex:
        error_details = (f'Request with ID "{ex.request_id}" failed with status "{ex.error.code().name}" and includes the following errors:')
        for error in ex.failure.errors:
            error_details += (f'\n\tError with message "{error.message}".')
            if error.location:
                for field_path_element in error.location.field_path_elements:
                    error_details += (f'\n\t\tOn field: {field_path_element.field_name}')
        return error_details

    except Exception as ex:
        return(f'Unexpected error occurred: {str(ex)}')
