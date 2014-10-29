<?php

namespace Indholdskanalen\MainBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Application\Sonata\MediaBundle\Entity\Media;
use JMS\Serializer\SerializationContext;

/**
 * @Route("/api/media")
 */
class MediaController extends Controller {
  /**
   * Manage file upload.
   *
   * @Route("")
   * @Method("POST")
   *
   * @param $request
   *   The Request object.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   */
  public function MediaUploadAction(Request $request) {
    $title = $request->request->get('title');

    $uploadedItems = array();

    foreach ($request->files as $file) {
      $media = new Media;

      if (isset($title) && $title !== '') {
        $media->setName($title);
      } else {
        $path_parts = pathinfo($file->getClientOriginalName());
        $media->setName($path_parts['filename']);
      }

      $mediaType = explode('/', $file->getMimeType());
      $mediaType = $mediaType[0];

      switch ($mediaType) {
        case 'video':
          $media->setProviderName('sonata.media.provider.zencoder');
          $media->setMediaType('video');
          break;

        case 'image':
          $media->setProviderName('sonata.media.provider.image');

          $isLogo = $request->request->get('logo');
          if (isset($isLogo) && $isLogo === 'true') {
            $media->setMediaType('logo');
          } else {
            $media->setMediaType('image');
          }

          break;

        default:
          $media->setProviderName('sonata.media.provider.image');
      }

      $media->setBinaryContent($file->getPathname());
      $media->setContext('default');

	    // Set creator.
	    $userEntity = $this->get('security.context')->getToken()->getUser();
	    $media->setUser($userEntity->getId());

      $mediaManager = $this->get("sonata.media.manager.media");

      $mediaManager->save($media);

      $uploadedItems[] = $media->getId();
    }

    $response = new Response(json_encode($uploadedItems));
    // JSON header.
    $response->headers->set('Content-Type', 'application/json');

    return $response;
  }

  /**
   * Sends all uploaded media.
   *
   * @Route("")
   * @Method("GET")
   *
   * @return \Symfony\Component\HttpFoundation\Response
   */
  public function MediaListAction() {
    $em = $this->getDoctrine()->getManager();
    $qb = $em->createQueryBuilder();

    $qb->select('m')
      ->from('ApplicationSonataMediaBundle:Media', 'm')
      ->orderBy('m.updatedAt', 'DESC');

    $query = $qb->getQuery();
    $results = $query->getResult();

    $response = new Response();

    $serializer = $this->get('jms_serializer');
    $jsonContent = $serializer->serialize($results, 'json');

    $response->setContent($jsonContent);
    // JSON header.
    $response->headers->set('Content-Type', 'application/json');

    return $response;
  }

  /**
   * Get a bulk of media.
   *
   * @Route("/bulk")
   * @Method("GET")
   *
   * @param $request
   *
   * @return \Symfony\Component\HttpFoundation\Response
   */
  public function MediaGetBulkAction(Request $request) {
    $ids = $request->query->get('ids');

    $response = new Response();

    // Check if slide exists, to update, else create new slide.
    if (isset($ids)) {
      $em = $this->getDoctrine()->getManager();

      $qb = $em->createQueryBuilder();
      $qb->select('m');
      $qb->from('ApplicationSonataMediaBundle:Media', 'm');
      $qb->where($qb->expr()->in('m.id', $ids));
      $results = $qb->getQuery()->getResult();

      // Sort the entities based on the order of the ids given in the
      // parameters.
      // @todo: Use mysql order by FIELD('id',1,4,2)....
      $entities = array();
      foreach ($ids as $id) {
        foreach ($results as $index => $entity) {
          if ($entity->getId() == $id) {
            $entities[] = $entity;
            unset($results[$index]);
          }
        }
      }

      $serializer = $this->get('jms_serializer');
      $response->headers->set('Content-Type', 'application/json');
      $response->setContent($serializer->serialize($entities, 'json', SerializationContext::create()->setGroups(array('api'))));
    }
    else {
      $response->setContent(json_encode(array()));
    }

    return $response;
  }

  /**
   * Get media with ID.
   *
   * @Route("/{id}")
   * @Method("GET")
   *
   * @param $id
   *
   * @return \Symfony\Component\HttpFoundation\Response
   */
  public function MediaGetAction($id) {
    $media = $this->getDoctrine()->getRepository('ApplicationSonataMediaBundle:Media')
      ->findOneById($id);

    // Create response.
    $response = new Response();
    $response->headers->set('Content-Type', 'application/json');

    if ($media) {
      $serializer = $this->get('jms_serializer');
      $jsonContent = $serializer->serialize($media, 'json', SerializationContext::create()->setGroups(array('api')));

      $response->setContent($jsonContent);
    }
    else {
      $response->setContent(json_encode(array()));
    }

    return $response;
  }

  /**
   * Delete media with ID.
   *
   * @Route("/{id}")
   * @Method("DELETE")
   *
   * @param $id
   *
   * @return \Symfony\Component\HttpFoundation\Response
   */
  public function MediaDeleteAction($id) {
    $em = $this->getDoctrine()->getManager();
    $media = $this->getDoctrine()->getRepository('ApplicationSonataMediaBundle:Media')->findOneById($id);

    // Create response.
    $response = new Response();
    $response->headers->set('Content-Type', 'application/json');

    if ($media && $media->getMediaOrders()->isEmpty()) {
      $em->remove(($media));
      $em->flush();
      $response->setContent(json_encode(array()));
    }
    else {
      $response->setContent(json_encode(array()));
    }

    return $response;
  }


}
