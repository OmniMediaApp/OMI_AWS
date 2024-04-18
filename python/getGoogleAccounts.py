from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
import asyncio

# Function to make a Google Ads API request
async def getGoogleAccounts():
    # Configuration for the Google Ads API client
    config = {
        "client_id": "776354593059-bkuqml5u1nfrmfqlmhcdactisbupqqb4.apps.googleusercontent.com",
        "client_secret": "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",
        "developer_token": "RTeEbkzAQJZQRKOnOG4r4w",
        "refresh_token": "1//04reYZjt3NWI9CgYIARAAGAQSNwF-L9Irj8n3gq1JNF09AQQR9N0OFhuezUUUX-6-Lnt30QxoF247SOHiByUF0wO7_Rkr38ckN4U",
        "use_proto_plus": True,
    }


    try:
        # Initialize the Google Ads client
        google_ads_client = GoogleAdsClient.load_from_dict(config)

        # Access the CustomerService
        customer_service = google_ads_client.get_service("CustomerService")

        # Make the API call to list accessible customers
        accessible_customers = customer_service.list_accessible_customers()

        final_array = []
        for index, account in enumerate(accessible_customers.resource_names):
            final_array.append({"name": account})

        return final_array

    except GoogleAdsException as ex:
        return(f'Request with ID "{ex.request_id}" failed with status "{ex.error.code().name}" and includes the following errors:')
        for error in ex.failure.errors:
            print(f'\tError with message "{error.message}".')
            if error.location:
                for field_path_element in error.location.field_path_elements:
                    print(f'\t\tOn field: {field_path_element.field_name}')
    except Exception as ex:
        return('Unexpected error occurred:', ex)


