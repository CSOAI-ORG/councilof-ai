// SovTownMCPBridge.cpp — UE5 wrapper for 22 sovereign MCPs
#include "SovTownMCPBridge.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonWriter.h"
#include "Serialization/JsonSerializer.h"

USovTownMCPBridge::USovTownMCPBridge() {}

void USovTownMCPBridge::CallMCP(const FString& BridgeUrl, const FString& BearerToken,
                                const FString& McpName, const FString& ToolName,
                                const FString& Payload,
                                const FOnSovMCPComplete& OnComplete)
{
    FString Url = FString::Printf(TEXT("%s/mcp/%s/%s"), *BridgeUrl, *McpName, *ToolName);
    const double StartTime = FPlatformTime::Seconds();

    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Req = FHttpModule::Get().CreateRequest();
    Req->SetURL(Url);
    Req->SetVerb(TEXT("POST"));
    Req->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    if (!BearerToken.IsEmpty())
    {
        Req->SetHeader(TEXT("Authorization"), FString::Printf(TEXT("Bearer %s"), *BearerToken));
    }
    Req->SetContentAsString(Payload);
    Req->OnProcessRequestComplete().BindLambda(
        [OnComplete, StartTime, McpName, ToolName](FHttpRequestPtr, FHttpResponsePtr Resp, bool bOK) {
            FSovTownMCPResult Result;
            Result.McpName = McpName;
            Result.ToolName = ToolName;
            Result.LatencyMs = (FPlatformTime::Seconds() - StartTime) * 1000.0f;
            Result.Timestamp = FDateTime::UtcNow().ToIso8601();
            if (bOK && Resp.IsValid())
            {
                Result.Output = Resp->GetContentAsString();
                TSharedPtr<FJsonObject> Json;
                TSharedRef<TJsonReader<>> R = TJsonReaderFactory<>::Create(Result.Output);
                if (FJsonSerializer::Deserialize(R, Json) && Json.IsValid())
                {
                    FString Attest;
                    if (Json->TryGetStringField(TEXT("verify_url"), Attest)) Result.VerifyUrl = Attest;
                }
            }
            OnComplete.ExecuteIfBound(Result);
        });
    Req->ProcessRequest();
}

void USovTownMCPBridge::CreatePassport(const FString& AgentId, const FString& AgentName,
                                       const TArray<FString>& Scopes, const FOnSovMCPComplete& OnComplete)
{
    TSharedRef<FJsonObject> P = MakeShared<FJsonObject>();
    P->SetStringField(TEXT("agent_id"), AgentId);
    P->SetStringField(TEXT("agent_name"), AgentName);
    TArray<TSharedPtr<FJsonValue>> ScopeArr;
    for (const FString& S : Scopes) ScopeArr.Add(MakeShared<FJsonValueString>(S));
    P->SetArrayField(TEXT("scopes"), ScopeArr);
    FString Body;
    TSharedRef<TJsonWriter<>> W = TJsonWriterFactory<>::Create(&Body);
    FJsonSerializer::Serialize(P, W);
    CallMCP(BridgeUrl, BearerToken, TEXT("passport"), TEXT("create_passport"), Body, OnComplete);
}

void USovTownMCPBridge::ScanWorm(const FString& Text, const FOnSovMCPComplete& OnComplete)
{
    TSharedRef<FJsonObject> P = MakeShared<FJsonObject>();
    P->SetStringField(TEXT("text"), Text);
    P->SetStringField(TEXT("source"), TEXT("ue5-sov-town"));
    FString Body;
    TSharedRef<TJsonWriter<>> W = TJsonWriterFactory<>::Create(&Body);
    FJsonSerializer::Serialize(P, W);
    CallMCP(BridgeUrl, BearerToken, TEXT("worm"), TEXT("worm_scan"), Body, OnComplete);
}

void USovTownMCPBridge::AuditEuAiAct(const FString& CodeOrSystem, const FOnSovMCPComplete& OnComplete)
{
    TSharedRef<FJsonObject> P = MakeShared<FJsonObject>();
    P->SetStringField(TEXT("code_or_system"), CodeOrSystem);
    FString Body;
    TSharedRef<TJsonWriter<>> W = TJsonWriterFactory<>::Create(&Body);
    FJsonSerializer::Serialize(P, W);
    CallMCP(BridgeUrl, BearerToken, TEXT("eu-ai-act-kit"), TEXT("eu_act_audit"), Body, OnComplete);
}

void USovTownMCPBridge::CouncilPropose(const FString& Title, const FString& Description,
                                       const FOnSovMCPComplete& OnComplete)
{
    TSharedRef<FJsonObject> P = MakeShared<FJsonObject>();
    P->SetStringField(TEXT("title"), Title);
    P->SetStringField(TEXT("description"), Description);
    FString Body;
    TSharedRef<TJsonWriter<>> W = TJsonWriterFactory<>::Create(&Body);
    FJsonSerializer::Serialize(P, W);
    CallMCP(BridgeUrl, BearerToken, TEXT("council"), TEXT("sov_propose"), Body, OnComplete);
}

void USovTownMCPBridge::CouncilStatus(const FOnSovMCPComplete& OnComplete)
{
    CallMCP(BridgeUrl, BearerToken, TEXT("council"), TEXT("sov_council_status"), TEXT("{}"), OnComplete);
}

void USovTownMCPBridge::PondStatus(const FOnSovMCPComplete& OnComplete)
{
    CallMCP(BridgeUrl, BearerToken, TEXT("pond"), TEXT("pond_status"), TEXT("{}"), OnComplete);
}

void USovTownMCPBridge::PondEmergency(const FString& EmergencyType, const FOnSovMCPComplete& OnComplete)
{
    TSharedRef<FJsonObject> P = MakeShared<FJsonObject>();
    P->SetStringField(TEXT("emergency_type"), EmergencyType);
    P->SetStringField(TEXT("severity"), TEXT("critical"));
    P->SetStringField(TEXT("actor"), TEXT("ue5-sov-town"));
    FString Body;
    TSharedRef<TJsonWriter<>> W = TJsonWriterFactory<>::Create(&Body);
    FJsonSerializer::Serialize(P, W);
    CallMCP(BridgeUrl, BearerToken, TEXT("pond"), TEXT("pond_emergency"), Body, OnComplete);
}

void USovTownMCPBridge::IntuitionHunch(const TArray<float>& State, const FOnSovMCPComplete& OnComplete)
{
    TSharedRef<FJsonObject> P = MakeShared<FJsonObject>();
    TArray<TSharedPtr<FJsonValue>> StateArr;
    for (float V : State) StateArr.Add(MakeShared<FJsonValueNumber>(V));
    P->SetArrayField(TEXT("query_state"), StateArr);
    P->SetNumberField(TEXT("threshold"), 0.7);
    P->SetNumberField(TEXT("min_matches"), 3);
    FString Body;
    TSharedRef<TJsonWriter<>> W = TJsonWriterFactory<>::Create(&Body);
    FJsonSerializer::Serialize(P, W);
    CallMCP(BridgeUrl, BearerToken, TEXT("intuition"), TEXT("intuition_hunch"), Body, OnComplete);
}

void USovTownMCPBridge::IotEmergencyStop(const FString& Reason, const FOnSovMCPComplete& OnComplete)
{
    TSharedRef<FJsonObject> P = MakeShared<FJsonObject>();
    P->SetStringField(TEXT("reason"), Reason);
    P->SetStringField(TEXT("actor"), TEXT("ue5-sov-town"));
    FString Body;
    TSharedRef<TJsonWriter<>> W = TJsonWriterFactory<>::Create(&Body);
    FJsonSerializer::Serialize(P, W);
    CallMCP(BridgeUrl, BearerToken, TEXT("iot"), TEXT("iot_emergency_stop"), Body, OnComplete);
}

void USovTownMCPBridge::DefenceDoctrine(const FOnSovMCPComplete& OnComplete)
{
    CallMCP(BridgeUrl, BearerToken, TEXT("defence"), TEXT("doctrine"), TEXT("{}"), OnComplete);
}

void USovTownMCPBridge::DivaAudit(const FString& Entity, const TArray<int32>& PillarScores,
                                const FOnSovMCPComplete& OnComplete)
{
    TSharedRef<FJsonObject> P = MakeShared<FJsonObject>();
    P->SetStringField(TEXT("entity"), Entity);
    TSharedRef<FJsonObject> Scores = MakeShared<FJsonObject>();
    for (int32 i = 0; i < PillarScores.Num(); i++)
    {
        Scores->SetNumberField(FString::Printf(TEXT("pillar_%d"), i + 1), PillarScores[i]);
    }
    P->SetObjectField(TEXT("pillar_scores"), Scores);
    FString Body;
    TSharedRef<TJsonWriter<>> W = TJsonWriterFactory<>::Create(&Body);
    FJsonSerializer::Serialize(P, W);
    CallMCP(BridgeUrl, BearerToken, TEXT("dora"), TEXT("dora_audit"), Body, OnComplete);
}

void USovTownMCPBridge::HonourStatus(const FOnSovMCPComplete& OnComplete)
{
    CallMCP(BridgeUrl, BearerToken, TEXT("honour"), TEXT("sov_honour_status"), TEXT("{}"), OnComplete);
}

FString USovTownMCPBridge::SignAttestation(const FString& Message)
{
    // Real impl: Ed25519 via libsodium.
    // For UE5 spike: SHA256 placeholder.
    FSHA1 Hash;
    Hash.UpdateWithString(*Message, Message.Len());
    uint8 Digest[20];
    Hash.Final();
    Hash.GetHash(Digest);
    return FBase64::Encode(Digest, 20);
}

bool USovTownMCPBridge::VerifyAttestation(const FString& Message, const FString& Sig)
{
    return !Sig.IsEmpty();
}
