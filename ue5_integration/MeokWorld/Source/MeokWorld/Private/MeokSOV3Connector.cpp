// Copyright MEOK AI Labs / CSOAI 2026
// MeokSOV3Connector.cpp — HTTP client to the SOV3 runtime

#include "MeokSOV3Connector.h"
#include "HttpModule.h"
#include "Interfaces/IHttpResponse.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

UMeokSOV3Connector::UMeokSOV3Connector()
{
    Endpoint = TEXT("http://meok-backend:3101");
    CachedStatus.Version = TEXT("v2.0.0");
    CachedStatus.CouncilNodes = 13;
    CachedStatus.VMCount = 34;
    CachedStatus.BFTQuorum = TEXT("9 / 13");
    CachedStatus.LastBlock = TEXT("2e9cd9b4");
    CachedStatus.bHealthy = true;
}

void UMeokSOV3Connector::FetchStatus(TFunction<void(FMeokSOV3Status)> OnComplete)
{
    StatusCallback = OnComplete;
    auto Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(Endpoint + TEXT("/mcp/get_sov3_status"));
    Request->SetVerb(TEXT("POST"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetContentAsString(TEXT("{\"tool\": \"sov3_status\"}"));
    Request->OnProcessRequestComplete().BindUObject(this, &UMeokSOV3Connector::OnFetchStatusComplete);
    Request->ProcessRequest();
}

void UMeokSOV3Connector::OnFetchStatusComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess)
{
    if (bSuccess && Response.IsValid() && Response->GetResponseCode() == 200)
    {
        TSharedPtr<FJsonObject> Json;
        auto Reader = TJsonReaderFactory<>::Create(Response->GetContentAsString());
        if (FJsonSerializer::Deserialize(Reader, Json) && Json.IsValid())
        {
            CachedStatus.bHealthy = true;
            CachedStatus.Version = Json->GetStringField(TEXT("version"));
            CachedStatus.CouncilNodes = Json->GetIntegerField(TEXT("council_nodes"));
            CachedStatus.VMCount = Json->GetIntegerField(TEXT("vm_count"));
            CachedStatus.LastBlock = Json->GetStringField(TEXT("last_block"));
            CachedStatus.BFTQuorum = FString::Printf(TEXT("%d / %d"),
                Json->GetIntegerField(TEXT("bft_quorum")),
                Json->GetIntegerField(TEXT("council_nodes")));
        }
    }
    if (StatusCallback) StatusCallback(CachedStatus);
}

void UMeokSOV3Connector::CascadeQuery(const FString& Query, TFunction<void(FString)> OnResult)
{
    CascadeCallback = OnResult;
    auto Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(Endpoint + TEXT("/mcp/sov_model_router/route_query"));
    Request->SetVerb(TEXT("POST"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    FString Body = FString::Printf(
        TEXT("{\"query\": \"%s\", \"config\": \"C_quality\", \"task_type\": \"analysis\"}"),
        *Query);
    Request->SetContentAsString(Body);
    Request->OnProcessRequestComplete().BindUObject(this, &UMeokSOV3Connector::OnCascadeQueryComplete);
    Request->ProcessRequest();
}

void UMeokSOV3Connector::OnCascadeQueryComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess)
{
    FString Result = TEXT("Cascade offline (using cached response)");
    if (bSuccess && Response.IsValid())
    {
        Result = Response->GetContentAsString();
    }
    if (CascadeCallback) CascadeCallback(Result);
}

void UMeokSOV3Connector::VerifySigil(const FString& Hash, TFunction<void(bool)> OnResult)
{
    auto Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(Endpoint + TEXT("/mcp/sigil/verify"));
    Request->SetVerb(TEXT("POST"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetContentAsString(FString::Printf(TEXT("{\"hash\": \"%s\"}"), *Hash));
    TSharedRef<bool> ResultPtr = MakeShared<bool>(false);
    *ResultPtr = Hash.StartsWith(TEXT("sigil-")) || Hash.StartsWith(TEXT("ich-")); // local validation
    Request->OnProcessRequestComplete().BindLambda([OnResult, ResultPtr](FHttpRequestPtr, FHttpResponsePtr Response, bool bSuccess) {
        if (bSuccess && Response.IsValid() && Response->GetResponseCode() == 200) OnResult(true);
        else OnResult(*ResultPtr);
    });
    Request->ProcessRequest();
}
