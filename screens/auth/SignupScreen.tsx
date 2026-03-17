import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { API_URL } from '../../lib/api';
import { UserInfo } from '../../App';

interface SignupScreenProps {
  onSignupComplete: (user: UserInfo, token: string) => void;
  onSwitchToLogin: () => void;
}

const PRIMARY = '#7370FF';

export default function SignupScreen({ onSignupComplete, onSwitchToLogin }: SignupScreenProps) {
  const [signUpStep, setSignUpStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyRole, setCompanyRole] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleButtonPress = async () => {
    if (signUpStep === 1) {
      if (!firstName.trim() || !lastName.trim() || !companyRole) {
        Alert.alert('Missing info', 'Please complete First Name, Last Name, and Company Role.');
        return;
      }
      setSignUpStep(2);
      return;
    }

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing info', 'Please complete all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password, companyRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Signup Failed', data.error || 'Something went wrong.');
        return;
      }
      onSignupComplete(data.user, data.token);
    } catch (err) {
      Alert.alert(
        'Connection Error',
        'Could not reach the server. Make sure the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputBoxStyle = {
    shadowColor: PRIMARY,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E7E7EE',
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* BACKGROUND GRADIENT */}
        <LinearGradient
          colors={['#D8D5FF', 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '60%' }}
        />
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingVertical: 40,
          }}
          enableOnAndroid
          extraScrollHeight={18}
          keyboardOpeningTime={220}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="w-full max-w-[360px] items-center">
            <Image
              source={require('../../assets/Buildspherelogo4x.png')}
              style={{ width: 56, height: 56 }}
              resizeMode="contain"
            />
            <Text className="mt-5 text-[22px] font-bold text-[#1E1E1E]">
              Sign Up in BuildSphere
            </Text>
            <View className="mt-2 flex-row items-center">
              <Text className="text-[12.5px] text-[#A3A3A3]">Already have an account? </Text>
              <TouchableOpacity onPress={onSwitchToLogin} activeOpacity={0.8}>
                <Text className="text-[12.5px] font-semibold text-[#7370FF]">Log In</Text>
              </TouchableOpacity>
            </View>

            <View className="mt-10 w-full">
              {signUpStep === 1 && (
                <>
                  <Text className="mb-2 text-[12px] font-semibold text-[#2D2D2D]">First Name</Text>
                  <View className="rounded-[12px] bg-white" style={inputBoxStyle}>
                    <TextInput
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Enter your first name"
                      placeholderTextColor="#B9B9B9"
                      className="h-[52px] px-4 text-[14px] text-[#1E1E1E]"
                      returnKeyType="next"
                    />
                  </View>
                  <Text className="mb-2 mt-6 text-[12px] font-semibold text-[#2D2D2D]">
                    Last Name
                  </Text>
                  <View className="rounded-[12px] bg-white" style={inputBoxStyle}>
                    <TextInput
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Enter your last name"
                      placeholderTextColor="#B9B9B9"
                      className="h-[52px] px-4 text-[14px] text-[#1E1E1E]"
                      returnKeyType="next"
                    />
                  </View>

                  <Text className="mb-2 mt-6 text-[12px] font-semibold text-[#2D2D2D]">
                    Company Role
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                    className="flex-row items-center justify-between rounded-[12px] bg-white px-4"
                    style={{ ...inputBoxStyle, height: 52 }}>
                    <Text className={`text-[14px] ${companyRole ? 'text-[#1E1E1E]' : 'text-[#B9B9B9]'}`}>
                      {companyRole || 'Select'}
                    </Text>
                    <Feather 
                      name="chevron-down" 
                      size={20} 
                      color="#1E1E1E" 
                      style={showRoleDropdown ? { transform: [{ rotate: '180deg' }] } : {}} 
                    />
                  </TouchableOpacity>

                  {showRoleDropdown && (
                    <View
                      className="mt-2 overflow-hidden rounded-[12px] bg-white"
                      style={inputBoxStyle}>
                      {['Proj. Engineer', 'Foreman'].map((role, index) => (
                        <TouchableOpacity
                          key={role}
                          activeOpacity={0.7}
                          onPress={() => {
                            setCompanyRole(role);
                            setShowRoleDropdown(false);
                          }}
                          className={`px-4 py-4 ${
                            index === 0 ? 'border-b border-[#E7E7EE]' : ''
                          }`}>
                          <Text
                            className={`text-[14px] ${
                              companyRole === role
                                ? 'font-semibold text-[#7370FF]'
                                : 'text-[#1E1E1E]'
                            }`}>
                            {role}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              {signUpStep === 2 && (
                <>
                  <Text className="mb-2 text-[12px] font-semibold text-[#2D2D2D]">Email</Text>
                  <View className="rounded-[12px] bg-white" style={inputBoxStyle}>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      placeholderTextColor="#B9B9B9"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      className="h-[52px] px-4 text-[14px] text-[#1E1E1E]"
                      returnKeyType="next"
                    />
                  </View>
                  <Text className="mb-2 mt-6 text-[12px] font-semibold text-[#2D2D2D]">
                    Password
                  </Text>
                  <View className="rounded-[12px] bg-white" style={inputBoxStyle}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="#B9B9B9"
                      secureTextEntry
                      className="h-[52px] px-4 text-[14px] text-[#1E1E1E]"
                      returnKeyType="next"
                    />
                  </View>
                  <Text className="mb-2 mt-6 text-[12px] font-semibold text-[#2D2D2D]">
                    Confirm Password
                  </Text>
                  <View className="rounded-[12px] bg-white" style={inputBoxStyle}>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm your password"
                      placeholderTextColor="#B9B9B9"
                      secureTextEntry
                      className="h-[52px] px-4 text-[14px] text-[#1E1E1E]"
                      returnKeyType="done"
                    />
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSignUpStep(1)}
                    className="mt-6 self-center">
                    <Text className="text-[12px] text-[#B8B8B8]">Back to Step 1</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleButtonPress}
                disabled={loading}
                className="mt-10 h-[52px] items-center justify-center rounded-[12px] bg-[#7370FF]"
                style={{
                  shadowColor: PRIMARY,
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 4,
                }}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-[15px] font-semibold text-white">
                    {signUpStep === 1 ? 'Next' : 'Sign Up'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
  );
}
