package com.ecommerce.project.service;

import com.ecommerce.project.exception.APIException;
import com.ecommerce.project.exception.ResourceNotFoundException;
import com.ecommerce.project.model.Address;
import com.ecommerce.project.model.User;
import com.ecommerce.project.payload.AddressDTO;
import com.ecommerce.project.repositories.AddressRepository;
import com.ecommerce.project.repositories.UserRepository;
import com.ecommerce.project.util.AuthUtil;
import org.modelmapper.ModelMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class AddressServiceImpl implements AddressService {

    private final ModelMapper modelMapper;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final AuthUtil authUtil;

    public AddressServiceImpl(ModelMapper modelMapper,
                              AddressRepository addressRepository,
                              UserRepository userRepository,
                              AuthUtil authUtil) {
        this.modelMapper = modelMapper;
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.authUtil = authUtil;
    }

    private void checkAddressOwnership(Address address, User user) {
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getRoleName().name().equals("ROLE_ADMIN"));
        if (!isAdmin && (address.getUser() == null || !address.getUser().getUserId().equals(user.getUserId()))) {
            throw new AccessDeniedException("You are not authorized to access or modify this address.");
        }
    }

    @Override
    @Transactional
    public AddressDTO createAddress(AddressDTO addressDTO, User user) {
        Address address = modelMapper.map(addressDTO, Address.class);
        address.setUser(user);

        List<Address> addressList = user.getAddresses();
        addressList.add(address);
        user.setAddresses(addressList);

        Address savedAddress = addressRepository.save(address);
        return modelMapper.map(savedAddress, AddressDTO.class);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressDTO> getAddresses() {
        List<Address> addresses = addressRepository.findAll();
        return addresses.stream().map(address -> modelMapper.map(address, AddressDTO.class)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AddressDTO getAddressById(Long addressId) {
        User currentUser = authUtil.loggedInUser();
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "addressId", addressId));

        checkAddressOwnership(address, currentUser);
        return modelMapper.map(address, AddressDTO.class);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressDTO> getUserAddresses(User user) {
        List<Address> addresses = addressRepository.findByUserUserId(user.getUserId());
        return addresses.stream().map(address -> modelMapper.map(address, AddressDTO.class)).toList();
    }

    @Override
    @Transactional
    public AddressDTO updateAddress(Long addressId, AddressDTO addressDTO) {
        User currentUser = authUtil.loggedInUser();
        Address addressFromDb = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "addressId", addressId));

        checkAddressOwnership(addressFromDb, currentUser);

        addressFromDb.setBuildingName(addressDTO.getBuildingName());
        addressFromDb.setCity(addressDTO.getCity());
        addressFromDb.setStreet(addressDTO.getStreet());
        addressFromDb.setState(addressDTO.getState());
        addressFromDb.setCountry(addressDTO.getCountry());
        addressFromDb.setPincode(addressDTO.getPincode());

        Address updatedAddress = addressRepository.save(addressFromDb);
        return modelMapper.map(updatedAddress, AddressDTO.class);
    }

    @Override
    @Transactional
    public String deleteAddress(Long addressId) {
        User currentUser = authUtil.loggedInUser();
        Address addressFromDb = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "addressId", addressId));

        checkAddressOwnership(addressFromDb, currentUser);

        User user = addressFromDb.getUser();
        if (user != null && user.getAddresses() != null) {
            user.getAddresses().removeIf(address -> Objects.equals(address.getAddressId(), addressId));
            userRepository.save(user);
        }

        addressRepository.delete(addressFromDb);
        return "Address with id " + addressId + " deleted successfully";
    }
}
