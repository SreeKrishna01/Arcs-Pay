import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { biometricApi } from "../api/resources";

export const isFingerprintSupported = () =>
  typeof window !== "undefined" &&
  !!window.PublicKeyCredential &&
  typeof navigator !== "undefined" &&
  !!navigator.credentials;

export async function enrollFingerprint(deviceName = "This device") {
  const { data } = await biometricApi.registerOptions();
  const regResponse = await startRegistration(data.options);
  const { data: result } = await biometricApi.registerVerify({ response: regResponse, deviceName });
  return result;
}

export async function verifyFingerprint() {
  const { data } = await biometricApi.assertionOptions();
  const authResponse = await startAuthentication(data.options);
  const { data: result } = await biometricApi.assertionVerify({ response: authResponse });
  return result;
}
